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
    let mod = require(f)
    if (_.isFunction(mod)) mod = mod.bind(this)
    else if (_.isPlainObject(mod) && _.has(mod, 'noScope') && _.isFunction(mod.handler)) mod = mod.handler
    helper[name] = mod
  })

  return helper
}
