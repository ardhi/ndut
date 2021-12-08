const mri = require('mri')
const argv = mri(process.argv.slice(2), {
  boolean: ['debug', 'print-routes', 'print-plugins'],
  string: ['data-dir', 'mode'],
  alias: {
    d: 'data-dir',
    m: 'mode'
  }
})
const { fs, _, aneka } = require('ndut-helper')
const { fatal, pathResolve } = aneka
const path = require('path')
const Fastify = require('fastify')
const prettifier = require('@mgcrea/pino-pretty-compact')
const Boom = require('@hapi/boom')
require('dotenv').config()

const actions = ['config', 'plugins', 'nduts', 'routes', 'misc']

const getConfig = async () => {
  const base = pathResolve(process.cwd())
  let cfg = {
    dir: {
      data: process.env.DATADIR || argv['data-dir'],
      base,
      route: `${base}/route`,
      tmp: `${base}/static`
    },
    routePrefix: '/',
    server: {
      ip: '127.0.0.1',
      port: 7777
    },
    factory: {}
  }
  if (_.isEmpty(cfg.dir.data)) fatal('No data directory provided')
  cfg.dir.data = pathResolve(cfg.dir.data)
  if (!fs.existsSync(cfg.dir.data)) fatal(`Directory '${cfg.dir.data}' doesn\'t exists!`)
  const cfgFile = pathResolve(path.join(cfg.dir.data, 'config.json'))
  if (!fs.existsSync(cfgFile)) fatal(`Configuration file '${cfgFile}' not found!`)
  try {
    cfg = _.merge(cfg, _.omit(require(cfgFile), ['dir']))
  } catch (err) {
    fatal(err.message)
  }
  cfg.mode = argv.mode || 'run'
  cfg.debug = process.env.DEBUG || argv.debug
  if (cfg.mode === 'build') cfg.debug = true
  process.env.DEBUG = cfg.debug
  process.env.NODE_ENV = cfg.debug ? 'development' : 'production'
  cfg.printRoutes = cfg.debug && argv['print-routes']
  cfg.printPlugins = cfg.debug && argv['print-plugins']
  cfg.args = argv._
  cfg.plugins = cfg.plugins || []
  cfg.routes = cfg.routes || []
  cfg.nduts = cfg.nduts || []
  if (!_.isBoolean(cfg.ensureDir)) cfg.ensureDir = true
  _.forOwn(cfg.dir, (v, k) => {
    cfg.dir[k] = pathResolve(v)
    if (cfg.ensureDir) fs.ensureDirSync(cfg.dir[k])
  })
  return cfg
}

module.exports = async function () {
  const config = await getConfig()
  const ndutsActions = []
  actions.forEach(a => {
    ndutsActions[a] = []
  })
  config.factory.logger = config.factory.logger ||
    (config.debug ? { prettyPrint: true, prettifier: prettifier.default, level: 'debug' } : { level: 'info' })
  config.factory.disableRequestLogging = config.factory.disableRequestLogging || config.debug
  const fastify = Fastify(_.cloneDeep(config.factory))
  if (config.debug) await fastify.register(require('@mgcrea/fastify-request-logger').default)
  fastify.decorate('config', config)
  fastify.decorate('Boom', Boom)
  return { fastify, ndutsActions, actions }
}
