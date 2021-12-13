const _ = require('lodash')
const { pathResolve } = require('aneka')

module.exports = function (plugins = [], config = {}, deep = false) {
  for (let p of plugins) {
    if (_.isString(p)) p = { name: p }
    if (p.name[0] === '.') p.name = pathResolve(p.name)
    const idx = _.findIndex(config.plugins, { name: p.name })
    if (idx > -1) {
      p.options = config.plugins[idx].options || p.options
      p.module = config.plugins[idx].module || p.module
      config.plugins[idx] = p
    }
    else config.plugins.push(p)
  }
}
