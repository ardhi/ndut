const _ = require('lodash')

module.exports = async function (nduts) {
  const { getNdutConfig, buildFrom } = this.ndut.helper
  for (const n of nduts) {
    if (!n.result.plugin) continue
    this.log.info(`Registering '${n.name}'`)
    await this.register(n.result.plugin, _.merge(n.result.options, n.options))
  }
  nduts = null
  // helper
  for (const n of _.map(this.config.nduts, 'name')) {
    const config = getNdutConfig(n)
    const name = _.camelCase(n)
    if (!this[name]) this.decorate(name, { helper: {} })
    this[name].helper = await buildFrom(`${config.dir}/ndut/helper`)
  }
  if (!this.app) this.decorate('app', { helper: {} })
  this.app.helper = await buildFrom(`${this.config.dir.base}/ndut/helper`)
}
