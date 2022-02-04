const listen = require('./listen')

module.exports = async function (config) {
  await listen.call(this, config)
  this.ndut.ready = true
}
