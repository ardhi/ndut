const mri = require('mri')
const argv = mri(process.argv.slice(2))
const fatal = require('aneka/src/misc/fatal')
const path = require('path')
const fs = require('fs-extra')

const initConfig = async () => {
  const dataDir = path.resolve(argv._[0] || process.cwd()).replace(/\\/g, '/')
  if (!fs.existsSync(dataDir)) fatal('Data directory doesn\'t exists!')
  for (const item of ['pub', 'tmp']) {
    await fs.ensureDir(path.join(dataDir, item))
  }
  const cfgFile = path.join(dataDir, 'config.json')
  if (!fs.existsSync(cfgFile)) fatal(`Configuration file "${cfgFile}" not found!`)
  let cfg = {}
  try {
    cfg = require(cfgFile)
  } catch (err) {
    fatal(err.message)
  }
  cfg.argv = argv
  cfg.dataDir = dataDir
  cfg.port = cfg.port || 7777
  cfg.server = cfg.server || 'localhost'
  cfg.plugins = cfg.plugins || []
  cfg.nduts = cfg.nduts || []
  return cfg
}

module.exports = async () => {
  const cfg = await initConfig()
  return cfg
}
