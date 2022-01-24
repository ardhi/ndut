const cluster = require('cluster')
const initConfig = require('./start/init-config')
const listen = require('./start/listen')
const handleDefaults = require('./start/handle-defaults')
const handleHelper = require('./start/handle-helper')
const handleCluster = require('./start/handle-cluster')
const handleNduts = require('./start/handle-nduts')
const handleNdutsPlugins = require('./start/handle-nduts-plugins')
const handleCorePlugins = require('./start/handle-core-plugins')
const configurePlugins = require('./start/configure-plugins')
require('log-timestamp')

const boot = async ({ scope, config }) => {
  await handleDefaults.call(scope, config)
  const oldPlugins = await configurePlugins.call(scope, config)
  const plugins = await handleNduts.call(scope, config)
  await handleCorePlugins.call(scope, config, oldPlugins)
  await handleNdutsPlugins.call(scope, config, plugins)
  await listen.call(scope, config)
}

module.exports = async function (options = {}) {
  const { scope, config } = await initConfig()
  await handleHelper.call(scope, config)
  scope.ndut.cluster = cluster

  if (config.instance > 1) {
    const workers = []
    workers.getNext = function () {
      return (Math.floor(Math.random() * this.length))
    }

    if (cluster.isMaster) {
      scope.log.info(`Master is running`)
      await scope.ndut.helper.fs.emptyDir(config.dir.lock)
      for (let i = 0; i < config.instance; i++) {
        if (config.workerStartDelay > 0)
          await scope.ndut.helper.aneka.delay(config.workerStartDelay)
        const worker = cluster.fork({ id: i })
        worker.id = i
        worker.on('message', () => {})
        workers.push(worker)
      }
      cluster.on('exit', (worker, code, signal) => {
        scope.log.warn(`thread ${worker.process.pid} died`)
      })
      await handleCluster.call(scope, config, cluster, workers)
    } else {
      scope.log.info(`Worker started`)
      await handleCluster.call(scope, config, cluster, workers)
      await boot({ scope, config })
    }
  } else {
    await boot({ scope, config })
  }
  return scope
}
