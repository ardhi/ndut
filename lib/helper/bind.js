const _ = require('lodash')

module.exports = function (fastify, helper) {
  const wrapped = {}
  _.forOwn(helper, (v, k) => {
    wrapped[k] = v.bind(fastify)
  })
  return wrapped
}
