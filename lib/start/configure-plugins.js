const mixPlugins = require('../helper/mix-plugins')
const qs = require('qs')

module.exports = async function (fastify) {
  const { config } = fastify
  const oldPlugins = config.plugins
  config.plugins = [
    'fastify-compress',
    'fastify-cors',
    {
      name: 'fastify-formbody',
      options: { parser: str => qs.parse(str) }
    },
    'fastify-multipart',
    'fastify-helmet',
    'middie'
  ]
  config.plugins = config.plugins.map(p => {
    if (typeof(p) === 'string') p = { name: p }
    p.module = require(p.name)
    return p
  })
  mixPlugins(config.plugins, config)
  return oldPlugins
}
