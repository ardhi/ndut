const _ = require('lodash')

const printLines = (fastify, text, method = 'debug') => {
  _.each(_.trim(text).split('\n'), line => {
    fastify.log[method](line)
  })
}

module.exports = async function (fastify) {
  const { config } = fastify
  try {
    await fastify.listen(config.server.port, config.server.ip)
    if (config.printRoutes) {
      fastify.log.info('Routes:')
      printLines(fastify, fastify.printRoutes({ commonPrefix: false }))
    }
    if (config.printPlugins) {
      fastify.log.info('Plugins:')
      printLines(fastify, fastify.printPlugins())
    }
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
