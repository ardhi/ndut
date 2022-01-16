const _ = require('lodash')

module.exports = async function (name, alias = false) {
  const { _, getConfig } = this.ndut.helper
  const config = await getConfig()
  if (alias) {
    let found
    for (const n of config.nduts) {
      const instanceName = _.camelCase(n)
      const cfg = this[instanceName].config
      if (cfg.alias === name) {
        found = cfg.name
        break
      }
    }
    if (found) name = found
  }
  return this[_.camelCase(name)].config
}
