const { cpus } = require('os')
const maxCpu = cpus().length
const preBoot = require('./start/pre-boot')
const boot = require('./start/boot')
const { setupPrimary, setupWorker, cluster } = require('./start/handle-cluster')
const postBoot = require('./start/post-boot')

module.exports = async function (options = {}) {
  const { scope, config } = await preBoot(options)
  config.instance = config.argv['instance'] || process.env.INSTANCE || 1
  if (config.instance === 'max') config.instance = maxCpu
  if (config.instance > maxCpu) config.instance = maxCpu
  if (config.appMode !== 'serve') config.instance = 1
  scope.ndut.cluster = cluster

  if (config.instance > 1) {
    if (cluster.isMaster) {
      await setupPrimary.call(scope, config)
    } else {
      await setupWorker.call(scope, config)
      await boot.call(scope, config)
      await postBoot.call(scope, config)
    }
  } else {
    await boot.call(scope, config)
    await postBoot.call(scope, config)
  }
  return scope
}
