const cluster = require('cluster')
const initConfig = require('./start/init-config')
const listen = require('./start/listen')
const handleDefaults = require('./start/handle-defaults')
const handleHelper = require('./start/handle-helper')
const handleNduts = require('./start/handle-nduts')
const handleNdutsPlugins = require('./start/handle-nduts-plugins')
const handleCorePlugins = require('./start/handle-core-plugins')
const configurePlugins = require('./start/configure-plugins')
require('log-timestamp')

const boot = async ({ scope, config, actions, ndutsActions }) => {
  await handleHelper.call(scope, config)
  await handleDefaults.call(scope)
  const oldPlugins = await configurePlugins.call(scope, config)
  const plugins = await handleNduts.call(scope, config, actions, ndutsActions)
  await handleCorePlugins.call(scope, config, oldPlugins)
  await handleNdutsPlugins.call(scope, config, plugins)
  await listen.call(scope, config)
}

module.exports = async function (options = {}) {
  const { scope, config, actions, ndutsActions } = await initConfig()
  if (config.instance > 1) {
    if (cluster.isMaster) {
      scope.log.info(`Master is running`)
      for (let i = 0; i < config.instance; i++) {
        const worker = cluster.fork()
      }
      cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`)
      })
    } else {
      scope.log.info(`Worker started`)
      await boot({ scope, config, actions, ndutsActions })
    }
  } else {
    await boot({ scope, config, actions, ndutsActions })
  }
  return scope
}
