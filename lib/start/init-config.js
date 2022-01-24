const fs = require('fs-extra')
const _ = require('lodash')
const { cpus } = require('os')
const { fatal, pathResolve, requireBase } = require('aneka')
const path = require('path')
const Fastify = require('fastify')
const prettifier = require('@mgcrea/pino-pretty-compact')
const Boom = require('@hapi/boom')
const mri = require('mri')
const argv = mri(process.argv.slice(2), {
  boolean: ['debug', 'print-routes', 'print-plugins'],
  string: ['data-dir', 'app-mode', 'tmp-dir'],
  alias: {
    d: 'data-dir',
    m: 'app-mode'
  }
})
require('dotenv').config()

const getConfig = async () => {
  const base = pathResolve(process.cwd())
  let cfg = {
    instance: argv['instance'] || process.env.INSTANCE || 1,
    dir: {
      data: argv['data-dir'] || process.env.DATADIR,
      tmp: argv['tmp-dir'] || process.env.TMPDIR,
      base
    },
    server: {
      host: '0.0.0.0',
      port: 7777
    },
    workerStartDelay: 0,
    factory: {}
  }
  if (cfg.instance === 'max') cfg.instance = cpus().length
  if (_.isEmpty(cfg.dir.data)) fatal('No data directory provided')
  cfg.dir.data = pathResolve(cfg.dir.data)
  if (!cfg.dir.tmp) cfg.dir.tmp = cfg.dir.data + '/tmp'
  cfg.dir.lock = cfg.dir.data + '/lock'
  if (!fs.existsSync(cfg.dir.data)) fatal(`Directory '${cfg.dir.data}' doesn\'t exists!`)
  fs.ensureDirSync(cfg.dir.data + '/config')
  const cfgFile = pathResolve(path.join(cfg.dir.data + '/config', 'ndut.json'))
  const cfgFileContent = await require(cfgFile)
  cfg = _.merge(cfg, _.omit(cfgFileContent, ['dir']))
  cfg.appMode = argv['app-mode'] || 'serve'
  if (cfg.appMode !== 'serve') cfg.instance = 1
  cfg.debug = process.env.DEBUG || argv.debug
  process.env.DEBUG = cfg.debug
  process.env.NODE_ENV = cfg.debug ? 'development' : 'production'
  cfg.printRoutes = cfg.debug && argv['print-routes']
  cfg.printPlugins = cfg.debug && argv['print-plugins']
  cfg.args = argv._
  cfg.argv = _.omit(argv, ['_'])
  cfg.plugins = cfg.plugins || []
  cfg.nduts = cfg.nduts || []
  cfg.nduts.unshift('app')
  if (!_.isBoolean(cfg.ensureDir)) cfg.ensureDir = true
  _.forOwn(cfg.dir, (v, k) => {
    cfg.dir[k] = pathResolve(v)
    if (cfg.ensureDir) fs.ensureDirSync(cfg.dir[k])
  })

  return cfg
}

module.exports = async function () {
  const config = await getConfig()
  config.factory.logger = config.factory.logger ||
    (config.debug ? { prettyPrint: true, prettifier: prettifier.default, level: 'debug' } : { level: 'info' })
  config.factory.disableRequestLogging = config.factory.disableRequestLogging || config.debug
  config.factory.pluginTimeout = config.factory.pluginTimeout || 30000
  const scope = Fastify(_.cloneDeep(config.factory))
  if (config.debug) await scope.register(require('@mgcrea/fastify-request-logger').default)
  scope.decorate('ndut', { config })
  scope.decorate('Boom', Boom)
  scope.log.info(`Entering '${config.appMode}' mode`)
  return { scope, config }
}
