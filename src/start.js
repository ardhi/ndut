const getConfig = require('./util/get-config')
const { isFunction, get, isString, find, map, merge } = require('lodash')
const print = require('aneka/src/misc/print')
const requireAll = require('aneka/src/loader/require-all')
const mixPlugins = require('ndut-helper/src/mix-plugins')
const scanForRoutes = require('ndut-helper/src/scan-for-routes')
const qs = require('qs')
const Fastify = require('fastify')
const prettifier = require('@mgcrea/pino-pretty-compact')
const fastifyStatic = require('fastify-static')
const favicon = require('./plugins/favicon')
require('log-timestamp')

const actions = ['beforeInject', 'afterInject', 'beforeListening']

module.exports = async function (options = {}) {
  const { afterConfig, beforeInject, afterInject, beforeListening } = options
  const config = await getConfig()
  const ndutsActions = []
  actions.forEach(a => {
    ndutsActions[a] = []
  })

  if (isFunction(afterConfig)) await afterConfig({ config })
  config.factory.logger = config.factory.logger ||
    (config.debug ? { prettyPrint: true, prettifier: prettifier.default, level: 'debug' } : { level: 'info' })
  config.factory.disableRequestLogging = config.factory.disableRequestLogging || config.debug
  const fastify = Fastify(config.factory)
  if (config.debug) fastify.register(require('@mgcrea/fastify-request-logger').default)
  fastify.decorate('config', config)
  fastify.decorate('Boom', require('@hapi/boom'))

  const oldPlugins = config.plugins
  config.plugins = [
    'fastify-compress',
    'fastify-cors',
    {
      name: 'fastify-formbody',
      options: { parser: str => qs.parse(str) }
    },
    'fastify-multipart',
    'fastify-helmet',
  ]
  config.plugins = config.plugins.map(p => {
    if (typeof(p) === 'string') p = { name: p }
    p.module = require(p.name)
    return p
  })
  mixPlugins(config.plugins, config)
  for (const fn of ndutsActions.beforeInject) {
    await fn({ fastify })
  }
  if (isFunction(beforeInject)) await beforeInject({ fastify })
  mixPlugins(config.plugins, config)

  for (let n of config.nduts) {
    if (isString(n)) n = { name: n }
    if (!n.disabled) {
      if (!n.module) n.module = require(n.name)
      const result = await n.module({ fastify })
      actions.forEach(a => {
        if (isFunction(result[a])) ndutsActions[a].push(result[a])
      })
      if (result.plugin) fastify.register(result.plugin, merge(result.pluginOptions, n.options))
    }
  }

  for (const fn of ndutsActions.afterInject) {
    await fn({ fastify })
  }
  if (isFunction(afterInject)) await afterInject({ fastify })
  mixPlugins(config.plugins, config)

  config.plugins.push({ name: 'fastify-static', module: fastifyStatic, options: { root: config.dir.public, prefix: config.prefix.public } })
  config.plugins.push({ name: 'favicon', module: favicon, options: { file: false } })
  mixPlugins(oldPlugins, config)

  for (let p of config.plugins) {
    if (!p.disabled) {
      if (p.module) await fastify.register(p.module, p.options)
      else await fastify.register(requireAll(p.name), p.options)
      if (p.module) delete p.module
    }
  }

  // await scanForRoutes(config.dir.route, fastify)
  for (const r of config.routes) {
    let module = require(r.file)
    if (isFunction(module)) module = await module(fastify)
    module.url = r.url
    module.method = r.method
    fastify.route(module)
  }
  fastify.setErrorHandler(function (error, request, reply) {
    reply.code(error.output.statusCode).send(error.message)
  })
  const preHandler = fastify.rateLimit ? fastify.rateLimit() : undefined
  fastify.setNotFoundHandler({
    preHandler
  }, function (request, reply) {
    throw new fastify.Boom.Boom('Page not found', { statusCode: 404 })
  })

  for (const fn of ndutsActions.beforeListening) {
    await fn({ fastify })
  }
  if (isFunction(beforeListening)) await beforeListening({ fastify })

  fastify.log.debug('Loaded root plugins:')
  config.plugins.forEach(item => {
    fastify.log.debug(`${item.disabled ? '-' : '+'} ${item.name}`)
  })

  try {
    await fastify.listen(config.server.port, config.server.ip)
    if (config.printRoutes) print('Routes:\n' + fastify.printRoutes({ commonPrefix: false }))
    if (config.printPlugins) print('Plugins:\n' + fastify.printPlugins())
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
