const handleNduts = require('./handle-nduts')
const handleNdutsPlugins = require('./handle-nduts-plugins')
const handleCorePlugins = require('./handle-core-plugins')
const configurePlugins = require('./configure-plugins')

module.exports = async function (config) {
  try {
    const oldPlugins = await configurePlugins.call(this, config)
    const plugins = await handleNduts.call(this, config)
    await handleCorePlugins.call(this, config, oldPlugins)
    await handleNdutsPlugins.call(this, config, plugins)
  } catch (err) {
    console.trace(err)
    if (config.instance === 1) process.exit(1)
    else process.send({ type: 'killall' })
  }
}
