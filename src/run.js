const { get } = require('lodash')

module.exports = async (fastify) => {
  const { config } = fastify
  const static = get(config, 'plugins.fastify-static')
  if (static !== false)
    fastify.register(require('fastify-static'), static || { root: config.dataDir + '/pub', prefix: '/assets' })
  const favicon = get(config, 'plugins.favicon')
  if (favicon !== false)
    fastify.register(require('./routes/favicon'), favicon || { file: false }) // meaning: no icon
  try {
    await fastify.listen(config.port, config.server)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
