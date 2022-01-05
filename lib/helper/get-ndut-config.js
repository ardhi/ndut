const _ = require('lodash')

module.exports = function (name, alias = false, returnIndex = false) {
  const match = alias ? { alias: name } : { name }
  if (returnIndex) return _.findIndex(this.config.nduts, match)
  return _.find(this.config.nduts, match) || {}
}
