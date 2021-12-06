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
require('dotenv').config()

module.exports = async function () {
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
  if (!fs.existsSync(cfg.dir.data)) fatal(`Directory "${cfg.dir.data}" doesn\'t exists!`)
  const cfgFile = pathResolve(path.join(cfg.dir.data, 'config.json'))
  if (!fs.existsSync(cfgFile)) fatal(`Configuration file "${cfgFile}" not found!`)
  try {
    cfg = _.merge(cfg, _.omit(require(cfgFile), ['dir']))
  } catch (err) {
    fatal(err.message)
  }
  cfg.mode = argv.mode || 'run'
  cfg.debug = process.env.DEBUG || argv.debug
  if (cfg.mode === 'build') cfg.debug = true
  process.env.DEBUG = cfg.debug
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
