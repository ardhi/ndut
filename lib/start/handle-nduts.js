const dotenvParseVariables = require('dotenv-parse-variables')

module.exports = async function (config) {
  const { _, fs, defNdutKeys, lockfile, aneka } = this.ndut.helper
  const { getModuleDirDeep, requireBase, humanJoin, isSet } = aneka
  let appModes = []

  this.log.info('Configure')
  const singleWorker = []
  const envCfg = {}
  const env = dotenvParseVariables(process.env)
  _.forOwn(env, (v, k) => {
    let [ns, key] = k.split('__')
    if (!key) return
    ns = _.camelCase(ns)
    if (!envCfg[ns]) envCfg[ns] = {}
    envCfg[ns][_.camelCase(key)] = v
  })
  const argCfg = {}
  _.forOwn(config.argv, (v, k) => {
    let [ns, key] = k.split('--')
    if (!key) return
    ns = _.camelCase(ns)
    if (!argCfg[ns]) argCfg[ns] = {}
    argCfg[ns][_.camelCase(key)] = v
  })

  for (const i in config.nduts) {
    const n = config.nduts[i]
    const dir = n === 'app' ? (config.dir.base + '/app') : getModuleDirDeep(n)
    const instanceName = _.camelCase(n)
    let cfg = { name: n }
    try {
      cfg = await requireBase(`${dir}/ndut/config.json`, this)
      cfg.name = n
    } catch (err) {}
    cfg.instanceName = instanceName
    cfg.dir = dir
    cfg.pkg = _.pick(require(`${dir + (n === 'app' ? '/..' : '')}/package.json`),
      ['name', 'version', 'description', 'author', 'license', 'homepage'])
    if (cfg.name === 'app') {
      cfg.prefix = ''
      cfg.alias = 'app'
    } else {
      if (!isSet(cfg.alias)) cfg.alias = n.slice(0, 5) === 'ndut-' ? n.slice(5) : n // fix. can't be overriden
      if (!isSet(cfg.prefix)) cfg.prefix = _.kebabCase(cfg.alias) // can be overridden via config.json
    }
    if (cfg.prefix[0] === '/') cfg.prefix = cfg.prefix.slice(1)
    // merge with config from datadir
    try {
      const altCfg = await requireBase(`${config.dir.data}/config/${cfg.instanceName}.json`)
      cfg = _.merge(cfg, _.omit(altCfg, defNdutKeys))
    } catch (err) {}
    // merge with args & process.env
    if (argCfg[cfg.instanceName]) cfg = _.merge(cfg, _.omit(argCfg[cfg.instanceName], defNdutKeys))
    if (envCfg[cfg.instanceName]) cfg = _.merge(cfg, _.omit(envCfg[cfg.instanceName], defNdutKeys))
    cfg.appModes = _.without(_.uniq(_.concat(['serve'], cfg.appModes || [])), null, undefined)
    cfg.dependency = cfg.dependency || []
    if (_.isString(cfg.dependency)) cfg.dependency = [cfg.dependency]
    appModes = _.uniq(_.concat(appModes, cfg.appModes))
    this[instanceName].config = cfg
    if (config.instance > 1 && cfg.singleWorker) {
      const lockfilePath = `${config.dir.lock}/${instanceName}.lock`
      const file = `${cfg.dir}/package.json`
      try {
        await lockfile.lock(file, { lockfilePath })
        this.log.debug(`* ${cfg.instanceName} (single worker mode)`)
      } catch (err) {
        singleWorker.push(n)
      }
    } else {
      this.log.debug(`* ${cfg.instanceName}`)
    }
  }
  _.each(singleWorker, w => {
    _.pull(config.nduts, w)
    delete this[_.camelCase(w)]
  })
  for (const n of config.nduts) {
    // dependency checking
    // TODO: semver
    const cfg = this[_.camelCase(n)].config
    if (cfg.dependency.length > 0 && _.intersection(config.nduts, cfg.dependency).length !== cfg.dependency.length)
      throw new Error(`Dependency for '${n}' unfulfilled: ${humanJoin(cfg.dependency)}`)
  }

  const inits = {}
  const plugins = []
  for (const n of config.nduts) {
    const name = _.camelCase(n)
    const cfg = this[name].config
    let init = null
    let file = `${cfg.dir}/ndut/init.js`
    if (fs.existsSync(file)) inits[name] = require(file)
    file = `${cfg.dir}/ndut/plugin.js`
    if (fs.existsSync(file)) {
      let mod = require(file)
      if (_.isFunction(mod) && mod.length === 0) mod = await mod.call(this)
      if (_.isArray(mod) || _.isFunction(mod)) mod = { handler: mod }
      mod.name = name
      if (mod.parent) mod.parent = _.camelCase(mod.parent)
      plugins.push(mod)
    }
  }
  if (!appModes.includes(config.appMode)) throw new Error(`Invalid app mode '${config.appMode}'. Supported modes: ${humanJoin(appModes)}`)
  for (const n of _.keys(inits)) {
    this.log.info(`Initialize '${n}'`)
    await inits[n].call(this, this[_.camelCase(n)].config)
  }
  return plugins
}
