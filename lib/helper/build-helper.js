const fastGlob = require('fast-glob')
const _ = require('lodash')
const { pathResolve } = require('aneka')
const path = require('path')

module.exports = async function (dir, except = []) {
  dir = pathResolve(dir)
  except = _.map(except, e => `${dir}/${e}`)
  let files = await fastGlob(`${dir}/**/*.js`)
  files = _.without(files, ...except)
  const helper = {}
  _.each(files, f => {
    const base = f.replace(dir, '').replace('.js', '')
    const name = _.camelCase(base)
    const mod = require(f)
    helper[name] = _.isFunction(mod) ? mod.bind(this) : mod
  })

  return helper
}
