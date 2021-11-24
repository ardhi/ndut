const getConfig = require('./util/get-config')
const { isFunction, get, isString } = require('lodash')
const requireAll = require('aneka/src/loader/require-all')
const mixPlugins = require('ndut-helper/src/mix-plugins')
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

  const oldPlugins = config.plugins
  config.plugins = []

  for (let ndut of config.nduts) {
    if (isString(ndut)) ndut = require(ndut)
    await ndut(fastify)
  }

  mixPlugins(oldPlugins, config)

  if (isFunction(beforeInject)) await beforeInject(fastify)

  for (let p of config.plugins) {
    if (p.module) await fastify.register(p.module, p.options)
    else await fastify.register(requireAll(p.name), p.options)
    if (p.module) delete p.module
  }

  if (isFunction(afterInject)) await afterInject(fastify)

  const static = get(config, 'plugins.fastify-static')
  if (static !== false) fastify.register(require('fastify-static'), static || { root: config.dataDir + '/pub', prefix: '/assets' })
  const favicon = get(config, 'plugins.favicon')
  if (favicon !== false) fastify.register(require('./routes/favicon'), favicon || { file: false }) // meaning: no icon

  if (isFunction(beforeListening)) await beforeListening(fastify)

  fastify.log.info('Loaded plugins:')
  config.plugins.forEach(item => {
    fastify.log.info(`- ${item.name}`)
  })

  try {
    await fastify.listen(config.port, config.server)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
