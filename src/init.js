const Fastify = require('fastify')
const prettifier = require('@mgcrea/pino-pretty-compact')

module.exports = config => {
  const logger = config.argv.debug ? { prettyPrint: true, prettifier: prettifier.default } : false
  const fastify = Fastify({
    logger,
    disableRequestLogging: config.argv.debug
  })
  fastify.decorate('config', config)
  if (config.argv.debug) fastify.register(require('@mgcrea/fastify-request-logger').default)
  return fastify
}
