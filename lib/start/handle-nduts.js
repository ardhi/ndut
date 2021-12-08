const { _, aneka } = require('ndut-helper')
const { getModuleDirDeep, humanJoin } = aneka

module.exports = async function (fastify, actions) {
  const { config } = fastify
  const plugins = []
  const keys = _.map(config.nduts, n => {
    return _.isString(n) ? n : n.name
  })
  for (let n of config.nduts) {
    if (_.isString(n)) n = { name: n }
    n.dir = getModuleDirDeep(n.name)
    if (!n.disabled) {
      if (!n.module) n.module = require(n.dir)
      n.prefix = n.prefix || (n.name.substr(0, 5) === 'ndut-' ? n.name.substr(5) : n.name)
      if (n.prefix[0] === '/') n.prefix = n.prefix.slice(1)
      const result = await n.module(fastify) || {}
      n.dependency = result.dependency || []
      if (n.dependency.length > 0 && _.intersection(keys, n.dependency).length === 0)
        throw new Error(`Dependency for ${n.name} unfulfilled: ${humanJoin(n.dependency)}`)
      fastify.log.info(`Initialize '${n.name}'`)
      if (result.config) n = _.merge(n, _.omit(config, ['name', 'dir', 'disabled', 'module']))
      _.each(actions, a => {
        if (_.isFunction(result[a])) ndutsActions[a].push(result[a])
      })
      if (result.plugin) {
        if (result.registerEarly) {
          fastify.log.info(`Registering '${n.name}' (early)`)
          await fastify.register(result.plugin, _.merge(result.options, n.options))
        }
        else plugins.push({ name: n.name, options: n.options, result })
      }
    }
    if (n.module) delete n.module
  }
  return plugins
}
