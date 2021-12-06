const getConfig = require('./util/get-config')
const { _, aneka, mixPlugins, scanForRoutes } = require('ndut-helper')
const { requireDeep, getModuleDirDeep } = aneka
const qs = require('qs')
const Fastify = require('fastify')
const prettifier = require('@mgcrea/pino-pretty-compact')
const favicon = require('./plugins/favicon')
const Boom = require('@hapi/boom')
require('log-timestamp')

const actions = ['beforeInject', 'afterInject', 'beforeListening']
const printLines = (fastify, text, method = 'debug') => {
  _.each(_.trim(text).split('\n'), line => {
    fastify.log[method](line)
  })
}

module.exports = async function (options = {}) {
  const { afterConfig, beforeInject, afterInject, beforeListening } = options
  const config = await getConfig()
  const ndutsActions = []
  actions.forEach(a => {
    ndutsActions[a] = []
  })

  if (_.isFunction(afterConfig)) await afterConfig(config)
  config.factory.logger = config.factory.logger ||
    (config.debug ? { prettyPrint: true, prettifier: prettifier.default, level: 'debug' } : { level: 'info' })
  config.factory.disableRequestLogging = config.factory.disableRequestLogging || config.debug
  const fastify = Fastify(_.cloneDeep(config.factory))
  if (config.debug) await fastify.register(require('@mgcrea/fastify-request-logger').default)
  fastify.decorate('config', config)
  fastify.decorate('Boom', Boom)

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
    await fn(fastify)
  }
  if (_.isFunction(beforeInject)) await beforeInject(fastify)
  mixPlugins(config.plugins, config)

  let ndutsPlugins = []
  for (let n of config.nduts) {
    if (_.isString(n)) n = { name: n }
    n.dir = getModuleDirDeep(n.name)
    if (!n.disabled) {
      if (!n.module) n.module = require(n.dir)
      n.prefix = n.prefix || (n.name.substr(0, 5) === 'ndut-' ? n.name.substr(5) : n.name)
      if (n.prefix[0] === '/') n.prefix = n.prefix.slice(1)
      const result = await n.module(fastify) || {}
      fastify.log.info(`Initialize '${n.name}'`)
      if (result.config) n = _.merge(n, _.omit(config, ['name', 'dir', 'disabled', 'module']))
      _.each(actions, a => {
        if (_.isFunction(result[a])) ndutsActions[a].push(result[a])
      })
      if (result.plugin) {
        if (result.registerEarly) {
          fastify.log.info(`Registering '${n.name}' (early)`)
          await fastify.register(result.plugin, _.merge(result.options, n.options))
        }
        else ndutsPlugins.push({ name: n.name, options: n.options, result })
      }
    }
    if (n.module) delete n.module
  }

  for (const fn of ndutsActions.afterInject) {
    await fn(fastify)
  }
  if (_.isFunction(afterInject)) await afterInject(fastify)
  mixPlugins(config.plugins, config)

  config.plugins.push({ name: 'favicon', module: favicon, options: { file: false } })
  mixPlugins(oldPlugins, config)

  fastify.log.info('Initialize main plugins')
  for (let p of config.plugins) {
    fastify.log.debug(`${p.disabled ? '-' : '+'} ${p.name}`)
    if (!p.disabled) {
      if (p.module) await fastify.register(p.module, p.options)
      else await fastify.register(requireDeep(p.name), p.options)
      if (p.module) delete p.module
    }
  }

  for (const n of ndutsPlugins) {
    fastify.log.info(`Registering '${n.name}'`)
    await fastify.register(n.result.plugin, _.merge(n.result.options, n.options))
  }
  ndutsPlugins = null

  const routes = await scanForRoutes(fastify, config.dir.route)
  for (const r of routes) {
    let module = require(r.file)
    if (_.isFunction(module)) module = await module(fastify)
    module.url = r.url
    module.method = r.method
    fastify.route(module)
  }
  fastify.setErrorHandler((error, request, reply) => {
    if (!error.isBoom) error = Boom.boomify(error)
    reply.code(error.output.statusCode).send(error.message)
  })
  fastify.setNotFoundHandler({
    preHandler: fastify.rateLimit ? fastify.rateLimit() : undefined
  }, (request, reply) => {
    throw new Boom.Boom('Page not found', { statusCode: 404 })
  })

  for (const fn of ndutsActions.beforeListening) {
    await fn(fastify)
  }
  if (_.isFunction(beforeListening)) await beforeListening(fastify)

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
