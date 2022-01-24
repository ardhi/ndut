const fs = require('fs-extra')

module.exports = async function (config, cluster, threads) {
  const { _, aneka } = this.ndut.helper
  for (const n of config.nduts) {
    const dir = n === 'app' ? config.dir.base : aneka.getModuleDirDeep(n)
    const file = `${dir}/ndut/cluster.js`
    if (fs.existsSync(file)) {
      const mod = require(file)
      await mod.call(this, cluster, threads)
    }
  }
}
