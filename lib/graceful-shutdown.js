const traps = require('@dnlup/fastify-traps')

module.exports = async function (scope, options) {
  scope.register(traps, {
    timeout: options.timeout || 5000,
    strict: false,
    onSignal (signal) {
      scope.log.warn(`Receive signal ${signal}`)
    },
    onClose () {
      scope.log.info('Server is shutdown')
    },
    onTimeout (timeout) {
      scope.log.error(`Force close after ${timeout} ms`)
    },
    onError (err) {
      scope.log.error(`Error: ${err.message}`)
    }
  })
}
