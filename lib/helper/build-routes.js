const path = require('path')

module.exports = async function (scope, name, scanDirs, prefix = '', notFoundMsg = 'Page not found') {
  const { _, fs, scanForRoutes, fastGlob } = scope.ndut.helper
  const { config } = scope
  const decorators = ['main', 'reply', 'request']

  scope.addHook('onRequest', async (request, reply) => {
    if (!request.routerPath) throw scope.Boom.notFound(notFoundMsg)
  })

  const dirPrefix = name ? `/${name}` : ''

  let hookFiles = []
  for (const n of config.nduts) {
    scanDirs = _.concat(scanDirs, [
      { dir: `${n.dir}${dirPrefix}/route`, options: { prefix: n.prefix } },
    ])
    for (const d of decorators) {
      const file = `${n.dir}${dirPrefix}/decorator/${d}.js`
      if (fs.existsSync(file)) {
        let mod = require(file)
        if (_.isFunction(mod)) mod = mod(scope)
        _.forOwn(mod, (v, k) => {
          scope['decorate' + (d === 'main' ? '' : _.upperFirst(d))](k, v)
        })
      }
    }
    hookFiles = _.concat(hookFiles, await fastGlob(`${n.dir}${dirPrefix}/hook/*.js`))
  }
  if (hookFiles.length > 0) {
    for (const f of hookFiles) {
      const method = _.camelCase(path.basename(f, '.js'))
      scope.addHook(method, require(f))
    }
  }
  let routes = []
  for (const s of scanDirs) {
    routes = _.concat(routes, await scanForRoutes(s.dir, s.options ))
  }

  for (const r of routes) {
    let module = require(r.file)
    if (_.isFunction(module)) module = await module(scope)
    scope.log.debug(`+ Route [${r.method}] ${_.isEmpty(prefix) ? '' : ('/' + prefix)}${r.url}`)
    module.url = r.url
    module.method = r.method
    scope.route(module)
  }
}
