const _ = require('lodash')

module.exports = async function (nduts) {
  const { getNdutConfig, buildHelper } = this.ndut.helper
  for (const n of nduts) {
    if (!n.plugin) continue
    this.log.info(`Registering '${n.name}'`)
    await this.register(n.plugin, n)
  }
  nduts = null
  for (const n of this.config.nduts) {
    delete n.plugin
    delete n.earlyPlugin
  }
  // helper
  for (const n of _.map(this.config.nduts, 'name')) {
    const config = getNdutConfig(n)
    const name = _.camelCase(n)
    if (!this[name]) this.decorate(name, { helper: {} })
    this[name].helper = await buildHelper(`${config.dir}/ndut/helper`)
  }
  if (!this.app) this.decorate('app', { helper: {} })
  this.app.helper = await buildHelper(`${this.config.dir.base}/ndut/helper`)
}
