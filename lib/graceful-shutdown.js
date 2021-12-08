const traps = require('@dnlup/fastify-traps')

module.exports = async function (fastify, options) {
  fastify.register(traps, {
    timeout: options.timeout || 2000,
    onSignal (signal) {
      fastify.log.warn(`Receive signal ${signal}`)
    },
    onClose () {
      fastify.log.info('Server is shutdown')
    },
    onTimeout (timeout) {
      fastify.log.error(`Force close after ${timeout} ms`)
    },
    onError (err) {
      fastify.log.error(`Error: ${err.message}`)
    }
  })
}
