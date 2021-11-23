const getConfig = require('./util/get-config')
const { isFunction, get, isString } = require('lodash')
const Fastify = require('fastify')
const prettifier = require('@mgcrea/pino-pretty-compact')

module.exports = async (options = {}) => {
  const { afterConfig, beforeInject, afterInject, beforeListening } = options
  const config = await getConfig()

  if (isFunction(afterConfig)) await afterConfig(config)
  const logger = config.argv.debug ? { prettyPrint: true, prettifier: prettifier.default } : false

  const fastify = Fastify({
    logger,
    disableRequestLogging: config.argv.debug
  })
  if (config.argv.debug) fastify.register(require('@mgcrea/fastify-request-logger').default)
  fastify.decorate('config', config)

  if (isFunction(beforeInject)) await beforeInject(fastify)

  for (const n of (config.nduts || [])) {
    const cfg = config.plugins[n]
    const mod = isString(n) ? require(n) : n
    await fastify.register(n, cfg)
  }

  if (isFunction(afterInject)) await afterInject(fastify)

  const static = get(config, 'plugins.fastify-static')
  if (static !== false) fastify.register(require('fastify-static'), static || { root: config.dataDir + '/pub', prefix: '/assets' })
  const favicon = get(config, 'plugins.favicon')
  if (favicon !== false) fastify.register(require('./routes/favicon'), favicon || { file: false }) // meaning: no icon

  if (isFunction(beforeListening)) await beforeListening(fastify)

  try {
    await fastify.listen(config.port, config.server)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
