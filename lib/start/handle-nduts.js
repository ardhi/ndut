const aneka = require('aneka')
const _ = require('lodash')
const { getModuleDirDeep, humanJoin } = aneka

module.exports = async function (fastify, actions) {
  const { config } = fastify
  const earlyPlugins = []
  const plugins = []
  const keys = _.map(config.nduts, n => {
    return _.isString(n) ? n : n.name
  })
  for (let n of config.nduts) {
    if (_.isString(n)) n = { name: n }
    n.dir = getModuleDirDeep(n.name)
    n.options = n.options || {}
    if (!n.disabled) {
      if (!n.module) n.module = require(n.dir)
      if (!_.isFunction(n.module)) throw new Error(`Invalid module '${n.name}'. A Ndut module should return an object with at least has 'name' key in it`)
      n.prefix = n.prefix || (n.name.substr(0, 5) === 'ndut-' ? n.name.substr(5) : n.name)
      if (n.prefix[0] === '/') n.prefix = n.prefix.slice(1)
      const result = await n.module(fastify) || {}
      if (result.name !== n.name) throw new Error(`Waiting for '${n.name}' and got '${result.name}'?`)
      n.dependency = result.dependency || []
      if (n.dependency.length > 0 && _.intersection(keys, n.dependency).length === 0)
        throw new Error(`Dependency for '${n.name}' unfulfilled: ${humanJoin(n.dependency)}`)
      n.appModes = result.appModes || ['serve']
      if (_.isString(n.appModes)) n.appModes = [n.appModes]
      if (!n.appModes.includes(config.appMode)) continue
      fastify.log.info(`Initialize '${n.name}'`)
      if (result.config) n = _.merge(n, _.omit(config, ['name', 'dir', 'disabled', 'module']))
      _.each(actions, a => {
        if (_.isFunction(result[a])) ndutsActions[a].push(result[a])
      })
      if (result.earlyPlugin) earlyPlugins.push({ name: n.name, options: n.options, result })
      else plugins.push({ name: n.name, options: n.options, result })
    }
    if (n.module) delete n.module
  }
  for (const n of earlyPlugins) {
    if (!n.result.earlyPlugin) continue
    fastify.log.info(`Registering '${n.name}' (early)`)
    await fastify.register(n.result.earlyPlugin, _.merge(n.result.options, n.options))
  }
  return plugins
}
