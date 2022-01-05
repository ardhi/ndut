const fs = require('fs-extra')
const _ = require('lodash')
const { fatal, pathResolve, humanJoin } = require('aneka')
const path = require('path')
const Fastify = require('fastify')
const prettifier = require('@mgcrea/pino-pretty-compact')
const Boom = require('@hapi/boom')
const mri = require('mri')
const argv = mri(process.argv.slice(2), {
  boolean: ['debug', 'print-routes', 'print-plugins'],
  string: ['data-dir', 'app-mode'],
  alias: {
    d: 'data-dir',
    m: 'app-mode'
  }
})
require('dotenv').config()

const actions = ['config', 'plugins', 'nduts', 'routes', 'misc']

const getConfig = async () => {
  const base = pathResolve(process.cwd())
  let cfg = {
    dir: {
      data: process.env.DATADIR || argv['data-dir'],
      base,
      route: `${base}/route`
    },
    server: {
      host: '127.0.0.1',
      port: 7777
    },
    factory: {}
  }
  if (_.isEmpty(cfg.dir.data)) fatal('No data directory provided')
  cfg.dir.data = pathResolve(cfg.dir.data)
  cfg.dir.tmp = cfg.dir.data + '/tmp'
  if (!fs.existsSync(cfg.dir.data)) fatal(`Directory '${cfg.dir.data}' doesn\'t exists!`)
  const cfgFile = pathResolve(path.join(cfg.dir.data, 'config.json'))
  if (!fs.existsSync(cfgFile)) fatal(`Configuration file '${cfgFile}' not found!`)
  try {
    cfg = _.merge(cfg, _.omit(require(cfgFile), ['dir']))
  } catch (err) {
    fatal(err.message)
  }
  cfg.appMode = argv['app-mode'] || 'serve'
  cfg.debug = process.env.DEBUG || argv.debug
  process.env.DEBUG = cfg.debug
  process.env.NODE_ENV = cfg.debug ? 'development' : 'production'
  cfg.printRoutes = cfg.debug && argv['print-routes']
  cfg.printPlugins = cfg.debug && argv['print-plugins']
  cfg.args = argv._
  cfg.plugins = cfg.plugins || []
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
  config.factory.pluginTimeout = config.factory.pluginTimeout || 30000
  const scope = Fastify(_.cloneDeep(config.factory))
  if (config.debug) await scope.register(require('@mgcrea/fastify-request-logger').default)
  scope.decorate('config', config)
  scope.decorate('Boom', Boom)
  scope.log.info(`Entering '${config.appMode}' mode`)
  return { scope, ndutsActions, actions }
}
