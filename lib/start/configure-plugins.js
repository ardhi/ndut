const mixPlugins = require('../helper/mix-plugins')
const queryString = require('query-string')
const _ = require('lodash')
const util = require('util')
const { pipeline } = require('stream')
const pump = util.promisify(pipeline)
const fs = require('fs-extra')

module.exports = async function (config) {
  const oldPlugins = _.cloneDeep(config.plugins)
  if (config.httpServer.disabled) return oldPlugins

  const onFileUploadHandler = async function (part, req) {
    const dir = `${config.dir.upload}/${req.id}`
    fs.ensureDirSync(dir)
    const filePath = `${dir}/${part.fieldname}-${part.filename}`
    await pump(part.file, fs.createWriteStream(filePath))
  }

  config.plugins = [
    // 'fastify-compress',  // trouble with streaming
    'fastify-cors',
    {
      name: 'fastify-formbody',
      options: { parser: str => queryString.parse(str, { parseNumbers: true, parseBooleans: true }) }
    },
    {
      name: 'fastify-multipart',
      options: { attachFieldsToBody: true, onFile: onFileUploadHandler }
    },
    {
      name: 'fastify-helmet',
      options: {
        frameguard: false,
        contentSecurityPolicy: false
      }
    }
  ]
  config.plugins = config.plugins.map(p => {
    // TODO: nicer name for file based plugins
    if (typeof(p) === 'string') p = { name: p }
    p.module = require(p.name)
    return p
  })
  mixPlugins(config.plugins, config)
  return oldPlugins
}
