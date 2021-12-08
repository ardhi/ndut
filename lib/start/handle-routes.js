const { _, scanForRoutes } = require('ndut-helper')

module.exports = async function (fastify) {
  const { config } = fastify
  const routes = await scanForRoutes(fastify, config.dir.route)
  for (const r of routes) {
    let module = require(r.file)
    if (_.isFunction(module)) module = await module(fastify)
    module.url = r.url
    module.method = r.method
    fastify.route(module)
  }
}
