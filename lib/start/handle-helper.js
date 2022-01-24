const initHelper = require('../helper/init')

module.exports = async function (config) {
  const helper = await initHelper.call(this)
  this.ndut.helper = helper

  const { _, buildHelper, aneka } = this.ndut.helper
  const { getModuleDirDeep } = aneka

  for (const n of config.nduts) {
    const dir = n === 'app' ? config.dir.base : getModuleDirDeep(n)
    const name = _.camelCase(n)
    this.decorate(name, { helper: {} })
    this[name].helper = await buildHelper.call(this, `${dir}/ndut/helper`)
  }
}
