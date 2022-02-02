module.exports = function (name) {
  const { _, getConfig } = this.ndut.helper
  const config = getConfig()
  const instanceName = _.camelCase(name)
  if (this[instanceName] && _.isPlainObject(this[instanceName].config) && this[instanceName].config.instanceName === instanceName)
    return this[instanceName].config
  let found
  for (const n of config.nduts) {
    const instanceName = _.camelCase(n)
    const cfg = this[instanceName].config
    if (cfg.alias === name || cfg.dir.startsWith(name)) {
      found = cfg.instanceName
      break
    }
  }
  if (found) return this[found].config
  return null
}
