const _ = require('lodash')
const fs = require('fs-extra')
const aneka = require('aneka')
const mixPlugins = require('../helper/mix-plugins')
const favicon = require('../plugins/favicon')
const gracefulShutdown = require('../plugins/graceful-shutdown')
const { requireDeep } = aneka

module.exports = async function (config, oldPlugins) {
  if (!config.httpServer.disabled) config.plugins.push({ name: 'favicon', module: favicon, options: { file: false } })
  config.plugins.push({ name: 'graceful-shutdown', module: gracefulShutdown })
  mixPlugins(oldPlugins, config)
  this.log.info('Configure core plugins')
  for (let p of config.plugins) {
    this.log.debug(`* ${p.name}`)
    if (p.module) await this.register(p.module, p.options)
    else await this.register(requireDeep(p.name), p.options)
    if (p.module) delete p.module
  }
  // fix fastify-multipart req.body
  this.addHook('preValidation', (request, reply, done) => {
    // const type = _.get(request, 'headers.content-type', '')
    // if (type.startsWith('multipart/form-data')) {
    if (request.isMultipart()) {
      const body = Object.fromEntries(
        Object.keys(request.body).map((key) => [key, request.body[key].value])
      )
      request.body = body
    }
    done()
  })
  // trash uploaded dir, if any
  this.addHook('onResponse', async (request, reply) => {
    const dir = `${config.dir.upload}/${request.id}`
    await fs.remove(dir)
  })
}
