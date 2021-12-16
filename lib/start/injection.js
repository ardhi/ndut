const _ = require('lodash')
const mixPlugins = require('../helper/mix-plugins')

module.exports = async function (name, options, ndutsActions) {
  const { config } = this
  if (ndutsActions) {
    for (const fn of ndutsActions[name]) {
      await fn(this)
    }
  }
  if (_.isFunction(options[name])) await options[name](this)
  if (ndutsActions) mixPlugins(config.plugins, config)
}
