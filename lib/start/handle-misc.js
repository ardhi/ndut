module.exports = async function () {
  this.setErrorHandler((error, request, reply) => {
    if (!error.isBoom) error = this.Boom.boomify(error)
    reply.code(error.output.statusCode).send(error.message)
  })
  this.setNotFoundHandler({
    preHandler: this.rateLimit ? this.rateLimit() : undefined
  }, (request, reply) => {
    throw new this.Boom.Boom('Page not found', { statusCode: 404 })
  })
}
