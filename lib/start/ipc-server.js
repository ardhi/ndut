const _ = require('lodash')
const ipc = require('@node-ipc/node-ipc').default

const serve = (config) => {
  return new Promise((resolve, reject) => {
    ipc.serve((err) => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

module.exports = async function (config) {
  if (config.ipcServer.disabled) {
    this.log.warn('IPC server is disabled')
    return
  }
  try {
    ipc.config = _.omit(config.ipcServer, ['socketRoot'])
    await serve(config)
    ipc.server.start()
  } catch (err) {
    this.log.error(err)
    this.ndut.helper.dumpError(err)
    process.exit(1)
  }
}
