const path = require('path')

// need to use dedicated scope, because scope can be fastify main instance OR encapsulated one!
module.exports = async function (scope, opts = {}) {
  let { name, scanDirs, prefix = '', notFoundMsg = 'Page not found', customBuilder } = opts
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
      { dir: `${n.dir}${dirPrefix}/route`, options: { prefix: n.prefix, alias: n.alias } },
    ])
    for (const d of decorators) {
      const file = `${n.dir}${dirPrefix}/decorator/${d}.js`
      if (fs.existsSync(file)) {
        let mod = require(file)
        if (_.isFunction(mod)) mod = mod.call(scope)
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
    routes = _.concat(routes, await scanForRoutes(s.dir, s.options))
  }

  for (const r of routes) {
    let module = require(r.file)
    if (_.isFunction(module)) module = await module.call(scope)
    module.url = r.url
    module.ndutAlias = r.alias
    if (!r.method.includes('CUSTOM')) {
      module.method = r.method
      scope.route(module)
      scope.log.debug(`+ Route [${r.method.join(',')}] ${_.isEmpty(prefix) ? '' : ('/' + prefix)}${r.url}`)
    } else if (_.isFunction(customBuilder)) {
      await customBuilder(scope, prefix, module)
    }
  }
}
