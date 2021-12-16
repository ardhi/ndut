module.exports = async function () {
  const { config } = this
  const { _, scanForRoutes } = this.ndut.helper
  const routes = await scanForRoutes(config.dir.route)
  for (const r of routes) {
    let module = require(r.file)
    if (_.isFunction(module)) module = await module(this)
    module.url = r.url
    module.method = r.method
    this.route(module)
  }
}
