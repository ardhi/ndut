const _ = require('lodash')

const printLines = (scope, text, method = 'debug') => {
  _.each(_.trim(text).split('\n'), line => {
    scope.log[method](line)
  })
}

module.exports = async function (config) {
  try {
    await this.listen(config.server)
    if (config.printRoutes) {
      this.log.info('Routes:')
      printLines(this, this.printRoutes({ commonPrefix: false }))
    }
    if (config.printPlugins) {
      this.log.info('Plugins:')
      printLines(this, this.printPlugins())
    }
  } catch (err) {
    this.log.error(err)
    this.ndut.helper.dumpError(err)
    process.exit(1)
  }
}
