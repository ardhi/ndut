const _ = require('lodash')
const aneka = require('aneka')
const mixPlugins = require('../helper/mix-plugins')
const favicon = require('../favicon')
const gracefulShutdown = require('../graceful-shutdown')
const { requireDeep } = aneka

module.exports = async function (oldPlugins) {
  const { config } = this

  config.plugins.push({ name: 'favicon', module: favicon, options: { file: false } })
  config.plugins.push({ name: 'graceful-shutdown', module: gracefulShutdown })
  mixPlugins(oldPlugins, config)

  this.log.info('Initialize core plugins')
  for (let p of config.plugins) {
    this.log.debug(`+ ${p.name}`)
    if (p.module) await this.register(p.module, p.options)
    else await this.register(requireDeep(p.name), p.options)
    if (p.module) delete p.module
  }
}
