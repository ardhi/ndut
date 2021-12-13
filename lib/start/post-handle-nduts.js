const _ = require('lodash')

module.exports = async function (fastify, plugins) {
  for (const n of plugins) {
    if (!n.result.plugin) continue
    fastify.log.info(`Registering '${n.name}'`)
    await fastify.register(n.result.plugin, _.merge(n.result.options, n.options))
  }
  plugins = null
}
