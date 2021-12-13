const _ = require('lodash')
const mixPlugins = require('../helper/mix-plugins')

module.exports = async function (fastify, name, options, ndutsActions) {
  const { config } = fastify
  if (ndutsActions) {
    for (const fn of ndutsActions[name]) {
      await fn(fastify)
    }
  }
  if (_.isFunction(options[name])) await options[name](fastify)
  if (ndutsActions) mixPlugins(config.plugins, config)
}
