const fg = require('fast-glob')
const path = require('path')
const pathResolve = require('aneka/src/fs/path-resolve')
const _ = require('lodash')

const verbs = ['HEAD', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']

module.exports = async function (fastify, dir = '', options = {}) {
  let baseDir
  if (!options.root) options.root = 'cwd'
  if (!options.prefix) options.prefix = '/'
  if (options.prefix[0] !== '/') options.prefix = '/' + options.prefix
  if (_.isEmpty(dir)) throw new Error('Directory to scan is not provided')
  if (path.isAbsolute(dir)) baseDir = dir
  else if (options.root === 'cwd') baseDir = fastify.config.dir.base + '/' + dir
  else if (options.root === 'dataDir') baseDir = fastify.config.dir.data + '/' + dir
  // else if (options.root === 'dirname') baseDir = path.join(__dirname, dir)
  else baseDir = dir
  baseDir = pathResolve(baseDir)
  const files = await fg(`${baseDir}/**/*.js`)
  const result = []
  const paths = {}
  for (const file of files) {
    let url = file
      .replace(baseDir, '')
      .replace(/@@/g, '\t')
      .replace(/@/g, ':')
      .replace(/\t/g, '@')
      .split('/')
      .slice(0, -1)
      .join('/')
    url = (options.prefix + url).replace(/\/\//g, '/')
    if (!paths[url]) paths[url] = []
    const method = path.basename(file, '.js').split('-').map(m => m.toUpperCase())
    let valid = true
    _.each(method, m => {
      if (!verbs.includes(m)) valid = false
    })
    if (valid && _.intersection(verbs, method).length > 0) {
      const check = _.intersection(paths[url], method)
      if (check.length > 0) throw new fastify.Boom.Boom(`Method '${method.join('-')}' clashed with '${paths[url].join('-')}' in path '${url}'`)
      paths[url] = _.uniq(_.concat(paths[url], method))
      result.push({ prefix: options.prefix, file, url, method })
    }
  }
  return result
}