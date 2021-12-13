const _ = require('lodash')

module.exports = function (fastify, name, returnIndex = false) {
  if (returnIndex) return _.findIndex(fastify.config.nduts, { name })
  return _.find(fastify.config.nduts, { name }) || {}
}
