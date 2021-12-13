const _ = require('lodash')
const aneka = require('aneka')
const mixPlugins = require('../helper/mix-plugins')
const favicon = require('../favicon')
const gracefulShutdown = require('../graceful-shutdown')
const { requireDeep } = aneka

module.exports = async function (fastify, oldPlugins) {
  const { config } = fastify
  if (['build'].includes(config.appMode)) return

  config.plugins.push({ name: 'favicon', module: favicon, options: { file: false } })
  config.plugins.push({ name: 'graceful-shutdown', module: gracefulShutdown })
  mixPlugins(oldPlugins, config)

  fastify.log.info('Initialize core plugins')
  for (let p of config.plugins) {
    fastify.log.debug(`${p.disabled ? '-' : '+'} ${p.name}`)
    if (!p.disabled) {
      if (p.module) await fastify.register(p.module, p.options)
      else await fastify.register(requireDeep(p.name), p.options)
      if (p.module) delete p.module
    }
  }
}
