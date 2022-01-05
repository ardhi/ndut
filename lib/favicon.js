const fs = require('fs-extra')
const mime = require('mime')

module.exports = async function (scope, opts) {
  scope.get('/favicon.ico', (request, reply) => {
    const noIcon = opts.file === false || !fs.existsSync(opts.file)
    if (noIcon) reply.code(404).send()
    else {
      const reader = fs.createReadStream(opts.file)
      const type = mime.getType(opts.file)
      reply.type(type).send(reader)
    }
  })
}