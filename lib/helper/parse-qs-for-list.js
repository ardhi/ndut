module.exports = function (request, model) {
  const { fastify, query } = request
  const restConfig = getNdutConfig(fastify, 'ndut-rest')
  const { queryKey, maxPageSize } = restConfig
  let limit = parseInt(query[queryKey.pageSize]) || maxPageSize
  if (limit > maxPageSize) limit = maxPageSize
  if (limit < 1) limit = 1
  let page = parseInt(query[queryKey.page]) || 1
  if (page < 1) page = 1
  let skip = (page - 1) * limit
  if (query[queryKey.offset]) {
    skip = parseInt(query[queryKey.offset]) || skip
    page = undefined
  }
  if (skip < 0) skip = 0
  let where = {}
  if (query[queryKey.query]) {
    try {
      where = JSON.parse(query[queryKey.query])
    } catch (err) {
      throw new Error(`Can't parse datasource query`)
    }
  }
  let order = query[queryKey.sort]
  if (!order) {
    const schema = _.find(getNdutConfig(fastify, 'ndut-db').schemas, { name: model }) || {}
    const keys = _.map(schema.columnns, 'name')
    const found = _.intersection(keys, ['updated_at', 'updatedAt', 'created_at', 'createdAt'])
    if (found[0]) order = `${found[0]} DESC`
  }
  return { limit, page, skip, order, where }
}
