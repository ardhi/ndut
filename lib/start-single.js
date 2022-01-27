const preBoot = require('./start/pre-boot')
const boot = require('./start/boot')
const postBoot = require('./start/post-boot')

module.exports = async function (options = {}) {
  const { scope, config } = await preBoot(options)
  config.instance = 1
  await boot.call(scope, config)
  await postBoot.call(scope, config)
  return scope
}
