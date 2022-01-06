const _ = require('lodash')

module.exports = async function (nduts) {
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
}
