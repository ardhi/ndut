const initHelper = require('../helper/init')

module.exports = async function () {
  const { config } = this
  const helper = await initHelper.call(this)
  this.decorate('ndut', { helper })

  const { _, buildHelper, aneka } = this.ndut.helper
  const { getModuleDirDeep } = aneka

  // nduts is still array of names only / object with default props
  for (const i in config.nduts) {
    let n = config.nduts[i]
    if (_.isString(n)) n = { name: n }
    config.nduts[i] = n
    n.dir = getModuleDirDeep(n.name)
    n.pkg = _.pick(require(`${n.dir}/package.json`), ['name', 'version', 'description', 'author', 'license', 'homepage'])
    n.alias = n.alias || (n.name.slice(0, 5) === 'ndut-' ? n.name.slice(5) : n.name) // fix. can't be overriden
    n.prefix = n.prefix || (n.name.slice(0, 5) === 'ndut-' ? n.name.slice(5) : n.name) // can be overridden via config.json
    if (n.prefix[0] === '/') n.prefix = n.prefix.slice(1)
    const name = _.camelCase(n.name)
    this.decorate(name, { helper: {} })
    this[name].helper = await buildHelper.call(this, `${n.dir}/ndut/helper`)
  }
  this.decorate('app', { helper: {} })
  this.app.helper = await buildHelper.call(this, `${config.dir.base}/ndut/helper`)
}