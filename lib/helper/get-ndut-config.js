const _ = require('lodash')

module.exports = function (name, returnIndex = false) {
  if (returnIndex) return _.findIndex(this.config.nduts, { name })
  return _.find(this.config.nduts, { name }) || {}
}
