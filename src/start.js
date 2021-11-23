const getConfig = require('./util/get-config')
const init = require('./init')
const run = require('./run')

module.exports = async () => {
  const config = await getConfig()
  const fastify = init(config)
  await run(fastify)
}
