const _ = require('lodash')

module.exports = function (scope, helper) {
  const wrapped = {}
  _.forOwn(helper, (v, k) => {
    if (!_.isFunction(v)) return
    wrapped[k] = v.bind(scope)
  })
  return wrapped
}
