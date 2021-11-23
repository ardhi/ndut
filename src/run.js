module.exports = async (fastify) => {
  const { config } = fastify
  if (config.static !== false)
    fastify.register(require('fastify-static'), config.static || { root: config.dataDir + '/pub', prefix: '/assets' })
  if (config.favicon !== false)
    fastify.register(require('./routes/favicon'), config.favicon || { file: false }) // meaning: no icon
  try {
    await fastify.listen(config.port, config.server)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
