const initConfig = require('./init-config')
const handleHelper = require('./handle-helper')
require('log-timestamp')

module.exports = async function (options = {}) {
  try {
    const { scope, config } = await initConfig(options)
    await handleHelper.call(scope, config)
    return { scope, config }
  } catch (err) {
    console.trace(err)
    if (config.instance === 1) process.exit(1)
    else process.send({ type: 'killall' })
  }
}
