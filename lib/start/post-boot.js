const httpServer = require('./http-server')
const ipcServer = require('./ipc-server')

module.exports = async function (config) {
  await httpServer.call(this, config)
  await ipcServer.call(this, config)
  this.ndut.ready = true
}
