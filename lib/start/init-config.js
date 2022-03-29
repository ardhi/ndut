const crypto = require('crypto')
const fs = require('fs-extra')
const queryString = require('query-string')
const _ = require('lodash')
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
let env = require('dotenv').config()
if (env.error) throw env.error

const getConfig = async () => {
  const base = pathResolve(process.cwd())
  let cfg = {
    dir: {
      data: argv['data-dir'] || process.env.DATADIR,
      tmp: argv['tmp-dir'] || process.env.TMPDIR,
      base
    },
    httpServer: {
      host: '0.0.0.0',
      port: 7777
    },
    workerStartDelay: 0,
    factory: {},
    cleanUploadedItems: true
  }
  if (_.isEmpty(cfg.dir.data)) fatal('No data directory provided')
  cfg.dir.data = pathResolve(cfg.dir.data)
  if (!cfg.dir.tmp) cfg.dir.tmp = cfg.dir.data + '/tmp'
  cfg.dir.lock = cfg.dir.data + '/lock'
  cfg.dir.upload = cfg.dir.data + '/upload'
  if (!fs.existsSync(cfg.dir.data)) fatal(`Directory '${cfg.dir.data}' doesn\'t exists!`)
  fs.ensureDirSync(cfg.dir.data + '/config')
  const cfgFile = pathResolve(path.join(cfg.dir.data + '/config', 'ndut.json'))
  const cfgFileContent = await require(cfgFile)
  cfg = _.merge(cfg, _.omit(cfgFileContent, ['dir']))
  cfg.appMode = argv['app-mode'] || 'serve'
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
  _.forOwn(cfg.dir, (v, k) => {
    cfg.dir[k] = pathResolve(v)
    fs.ensureDirSync(cfg.dir[k])
  })

  return cfg
}

module.exports = async function () {
  const config = await getConfig()
  if (crypto.randomUUID) config.factory.genReqId = req => (crypto.randomUUID())
  config.factory.logger = config.factory.logger ||
    (config.debug ? { prettyPrint: true, prettifier: prettifier.default, level: 'debug' } : { level: 'info' })
  config.factory.disableRequestLogging = config.factory.disableRequestLogging || config.debug
  config.factory.pluginTimeout = config.factory.pluginTimeout || 30000
  config.factory.querystringParser = str => queryString.parse(str, { parseNumbers: true, parseBooleans: true })
  const scope = Fastify(_.cloneDeep(config.factory))
  if (config.debug) await scope.register(require('@mgcrea/fastify-request-logger').default)
  scope.decorate('ndut', { config, ready: false })
  scope.decorate('Boom', Boom)
  scope.log.info(`Entering '${config.appMode}' mode`)
  return { scope, config }
}
