const _ = require('lodash')

module.exports = async function (config, plugins) {
  const { defNdutKeys } = this.ndut.helper
  for (const n of _.keys(plugins)) {
    this.log.info(`Registering '${n}'`)
    await this.register(plugins[n], this[n].config)
  }
}
