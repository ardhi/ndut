const { _ } = require('ndut-helper')

module.exports = async function (fastify, plugins) {
  for (const n of plugins) {
    fastify.log.info(`Registering '${n.name}'`)
    await fastify.register(n.result.plugin, _.merge(n.result.options, n.options))
  }
  plugins = null
}
