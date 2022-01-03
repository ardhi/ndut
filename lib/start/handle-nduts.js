const aneka = require('aneka')
const { requireBase } = aneka
const _ = require('lodash')
const { getModuleDirDeep, humanJoin } = aneka

module.exports = async function (actions, ndutsActions) {
  const { defNdutKeys } = this.ndut.helper
  const { config } = this
  const earlyNduts = []
  const nduts = []
  const keys = _.map(config.nduts, n => {
    return _.isString(n) ? n : n.name
  })
  let appModes = ['serve']
  for (const i in config.nduts) {
    let n = config.nduts[i]
    if (_.isString(n)) n = { name: n }
    config.nduts[i] = n
    n.dir = getModuleDirDeep(n.name)
    n.pkg = _.pick(require(`${n.dir}/package.json`), ['name', 'version', 'description', 'author', 'license', 'homepage'])
    // merge actual config with its json/js file
    try {
      const altCfg = await requireBase(`${config.dir.data}/${_.camelCase(n.name)}/config`)
      n = _.merge(n, _.omit(altCfg, defNdutKeys))
    } catch (err) {}
    if (!n.module) n.module = require(n.dir)
    if (!_.isFunction(n.module)) throw new Error(`Invalid module '${n.name}'. A Ndut module should return an object with at least has 'name' key in it`)
    n.alias = n.alias || (n.name.slice(0, 5) === 'ndut-' ? n.name.slice(5) : n.name) // fix. can't be overriden
    n.prefix = n.prefix || (n.name.slice(0, 5) === 'ndut-' ? n.name.slice(5) : n.name) // can be overridden via config.json
    if (n.prefix[0] === '/') n.prefix = n.prefix.slice(1)
    const result = await n.module.call(this) || {}
    if (result.name !== n.name) throw new Error(`Waiting for '${n.name}' and got '${result.name}'?`)
    n = _.merge(n, _.omit(result.options, defNdutKeys))
    n.plugin = result.plugin
    n.earlyPlugin = result.earlyPlugin
    n.dependency = result.dependency || []
    n.appModes = result.appModes || ['serve']
    // dependency checking
    // TODO: semver
    if (n.dependency.length > 0 && _.intersection(keys, n.dependency).length === 0)
      throw new Error(`Dependency for '${n.name}' unfulfilled: ${humanJoin(n.dependency)}`)
    if (_.isString(n.appModes)) n.appModes = [n.appModes]
    appModes = _.concat(appModes, n.appModes)
    this.log.info(`Initialize '${n.name}'`)
    _.each(actions, a => {
      if (_.isFunction(result[a])) ndutsActions[a].push(result[a])
    })
    if (result.earlyPlugin) earlyNduts.push(n)
    if (result.plugin) nduts.push(n)
    if (n.module) delete n.module
  }
  if (!appModes.includes(config.appMode)) throw new Error(`Invalid app mode '${config.appMode}'. Supported modes: ${humanJoin(appModes)}`)
  for (const n of earlyNduts) {
    if (!n.earlyPlugin) continue
    this.log.info(`Registering '${n.name}' (early)`)
    await this.register(n.earlyPlugin, n)
  }
  return nduts
}
