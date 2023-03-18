const { DataStream, StringStream } = require('scramjet')
const JSONStream = require('JSONStream')
const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')

module.exports = async (file, handler, options) => {
  if (!handler) throw new Error('A function handler must be defined')
  const format = path.extname(file)
  if (!['.json', '.jsonl'].includes(format)) throw new Error(`Invalid import format '${file}'`)
  const exists = await fs.pathExists(file)
  if (!exists) throw new Error(`File not found '${file}'`)
  if (_.isString(options.extend)) options.extend = [options.extend]
  if (!_.isEmpty(options.extend) && path.extname(file) === '.json') {
    let records = require(file)
    _.each(options.extend, f => {
      records = _.merge(records, require(f))
    })
    await handler(records, options.handler || {})
    return
  }
  const reader = fs.createReadStream(file)
  let count = 0
  reader.on('error', err => {
    throw err
  })
  const stream = format === '.json'
    ?
    DataStream.pipeline(
      reader,
      JSONStream.parse('*')
    )
    :
    StringStream.from(reader).lines()

  await stream
    .batch(options.batchNum || 1000)
    .map(async items => {
      if (_.isEmpty(items)) return
      const records = []
      for (let i = 0; i < items.length; i++) {
        if (_.isString(items[i])) items[i] = _.trim(items[i])
        if (_.isEmpty(items[i])) continue
        try {
          if (_.isString(items[i])) items[i] = JSON.parse(items[i])
          if (_.isEmpty(items[i])) continue
          count++
          records.push(items[i])
        } catch (err) {
          if (!options.ignoreParseError) throw err
        }
      }
      await handler(records, options.handler || {})
    })
    .run()
}
