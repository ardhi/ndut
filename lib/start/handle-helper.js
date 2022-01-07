const initHelper = require('../helper/init')

module.exports = async function () {
  const { config } = this
  const helper = await initHelper.call(this)
  this.decorate('ndut', { helper })

  const { _, buildHelper, aneka } = this.ndut.helper
  const { getModuleDirDeep } = aneka

  for (const n of config.nduts) {
    const dir = getModuleDirDeep(n)
    const name = _.camelCase(n)
    this.decorate(name, { helper: {} })
    this[name].helper = await buildHelper.call(this, `${dir}/ndut/helper`)
  }
  this.decorate('app', { helper: {} })
  this.app.helper = await buildHelper.call(this, `${config.dir.base}/ndut/helper`)
}