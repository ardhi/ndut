const cluster = require('cluster')

const setupPrimary = async function (config) {
  const { fs, aneka } = this.ndut.helper
  this.log.info(`Master is running`)
  await fs.emptyDir(config.dir.lock)
  for (let i = 0; i < config.instance; i++) {
    if (config.workerStartDelay > 0)
      await aneka.delay(config.workerStartDelay)
    const worker = cluster.fork({ id: i })
    worker.on('message', ({ type, data }) => {
      switch (type) {
        case 'killall':
          for (const i in cluster.workers) {
            cluster.workers[i].kill()
          }
          process.exit(1)
          break
      }
    })
    worker.id = i
  }
  cluster.on('exit', (worker, code, signal) => {
    this.log.warn(`thread ${worker.process.pid} died`)
  })
  await handleNdutsCluster.call(this, config, cluster)
}

const setupWorker = async function (config) {
  this.log.info(`Worker started`)
  await handleNdutsCluster.call(this, config, cluster)
}

const handleNdutsCluster = async function (config) {
  const { _, fs, aneka } = this.ndut.helper
  for (const n of config.nduts) {
    const dir = n === 'app' ? config.dir.base : aneka.getModuleDirDeep(n)
    const file = `${dir}/ndut/cluster.js`
    if (fs.existsSync(file)) {
      const mod = require(file)
      await mod.call(this, cluster)
    }
  }
}

module.exports = { cluster, setupPrimary, setupWorker, handleNdutsCluster }
