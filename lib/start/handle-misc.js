module.exports = async function (fastify) {
  fastify.setErrorHandler((error, request, reply) => {
    if (!error.isBoom) error = fastify.Boom.boomify(error)
    reply.code(error.output.statusCode).send(error.message)
  })
  fastify.setNotFoundHandler({
    preHandler: fastify.rateLimit ? fastify.rateLimit() : undefined
  }, (request, reply) => {
    throw new fastify.Boom.Boom('Page not found', { statusCode: 404 })
  })
}
