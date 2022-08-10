module.exports = async function (handler, options = {}) {
  const { getConfig, getNdutConfig } = this.ndut.helper
  const config = getConfig()
  const result = {}
  const key = options.resultKey || 'instanceName'
  for (const n of config.nduts) {
    const cfg = getNdutConfig(n)
    const r = await handler.call(this, cfg, config)
    if (r === false) break
    else result[cfg[key]] = r
  }
  return result
}
