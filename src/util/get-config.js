const mri = require('mri')
const argv = mri(process.argv.slice(2), {
  boolean: ['debug', 'print-routes', 'print-plugins'],
  string: ['data-dir'],
  alias: {
    d: 'data-dir'
  }
})
const fatal = require('aneka/src/misc/fatal')
const pathResolve = require('aneka/src/fs/path-resolve')
const path = require('path')
const fs = require('fs-extra')
const { isEmpty, merge, forOwn, isBoolean, omit } = require('lodash')

const initConfig = async () => {
  let cfg = {
    dir: {
      data: argv['data-dir'],
      route: './routes',
      public: './public',
      tmp: './tmp'
    },
    prefix: {
      route: '/',
      public: '/assets'
    },
    server: {
      ip: '127.0.0.1',
      port: 7777
    },
    factory: {}
  }
  if (isEmpty(cfg.dir.data)) fatal('No data directory provided')
  cfg.dir.data = pathResolve(cfg.dir.data)
  if (!fs.existsSync(cfg.dir.data)) fatal(`Directory "${cfg.dir.data}" doesn\'t exists!`)
  const cfgFile = pathResolve(path.join(cfg.dir.data, 'config.json'))
  if (!fs.existsSync(cfgFile)) fatal(`Configuration file "${cfgFile}" not found!`)
  try {
    cfg = merge(cfg, omit(require(cfgFile), ['dir']))
  } catch (err) {
    fatal(err.message)
  }
  cfg.debug = argv.debug
  cfg.printRoutes = argv.debug && argv['print-routes']
  cfg.printPlugins = argv.debug && argv['print-plugins']
  cfg.plugins = cfg.plugins || []
  cfg.routes = cfg.routes || []
  cfg.nduts = cfg.nduts || []
  if (!isBoolean(cfg.ensureDir)) cfg.ensureDir = true
  forOwn(cfg.dir, (v, k) => {
    cfg.dir[k] = pathResolve(v)
    if (cfg.ensureDir) fs.ensureDirSync(cfg.dir[k])
  })
  cfg.dir.base = pathResolve(process.cwd())
  return cfg
}

module.exports = async function () {
  const cfg = await initConfig()
  return cfg
}
