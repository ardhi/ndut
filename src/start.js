const getConfig = require('./util/get-config')
const init = require('./init')
const { isString, camelCase } = require('lodash')

module.exports = async () => {
  const config = await getConfig()
  const fastify = init(config)
  for (const p of config.plugins || []) {
    if (isString(p)) p = { id: camelCase(p), module: p }
    fastify.register(p.module, p.options)
  }
  try {
    await fastify.listen(config.port, config.server)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
