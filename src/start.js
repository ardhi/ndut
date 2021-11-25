const getConfig = require('./util/get-config')
const { isFunction, get, isString, find } = require('lodash')
const print = require('aneka/src/misc/print')
const requireAll = require('aneka/src/loader/require-all')
const mixPlugins = require('ndut-helper/src/mix-plugins')
const scanForRoutes = require('ndut-helper/src/scan-for-routes')
const Fastify = require('fastify')
const prettifier = require('@mgcrea/pino-pretty-compact')
const fastifyStatic = require('fastify-static')
const favicon = require('./plugins/favicon')
require('log-timestamp')

module.exports = async (options = {}) => {
  const { afterConfig, beforeInject, afterInject, beforeListening } = options
  const config = await getConfig()

  if (isFunction(afterConfig)) await afterConfig(config)
  config.factory.logger = config.factory.logger ||
    (config.debug ? { prettyPrint: true, prettifier: prettifier.default, level: 'debug' } : { level: 'info' })
  config.factory.disableRequestLogging = config.factory.disableRequestLogging || config.debug
  const fastify = Fastify(config.factory)
  if (config.debug) fastify.register(require('@mgcrea/fastify-request-logger').default)
  fastify.decorate('config', config)

  const oldPlugins = config.plugins
  config.plugins = []

  for (let n of config.nduts) {
    if (isString(n)) n = { name: n }
    if (!n.disabled) {
      if (!n.module) n.module = require(n.name)
      await n.module(fastify)
    }
  }
  config.plugins.push({ name: 'fastify-static', module: fastifyStatic, options: { root: config.dir.public, prefix: config.prefix.public } })
  config.plugins.push({ name: 'favicon', module: favicon, options: { file: false } })
  mixPlugins(oldPlugins, config)

  if (isFunction(beforeInject)) await beforeInject(fastify)
  mixPlugins(config.plugins, config) // making sure all plugins (especially that don't come from nduts) got mixed

  for (let p of config.plugins) {
    if (!p.disabled) {
      if (p.module) await fastify.register(p.module, p.options)
      else await fastify.register(requireAll(p.name), p.options)
      if (p.module) delete p.module
    }
  }

  if (isFunction(afterInject)) await afterInject(fastify)
  await scanForRoutes(config.dir.route, fastify)
  if (isFunction(beforeListening)) await beforeListening(fastify)

  fastify.log.debug('Loaded plugins:')
  config.plugins.forEach(item => {
    fastify.log.debug(`${item.disabled ? '-' : '+'} ${item.name}`)
  })

  try {
    await fastify.listen(config.server.port, config.server.ip)
    if (config.debugRoute) {
      print('Routes:\n' + fastify.printRoutes())
    }
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
