const path = require('path')
const zlib = require('zlib')

const gzipping = function (file) {
  const { fs } = this.ndut.helper
  return new Promise((resolve, reject) => {
    const reader = fs.createReadStream(file)
    const writer = fs.createWriteStream(file + '.gz')
    const gzip = zlib.createGzip()
    reader.pipe(gzip).pipe(writer)
    writer.on('finish', err => {
      if (err) return reject(err)
      fs.unlinkSync(file)
      resolve()
    })
  })
}

module.exports = function (file, data, options) {
  const { fs, JSONStream } = this.ndut.helper
  return new Promise((resolve, reject) => {
    const format = path.extname(file)
    if (!['.json', '.jsonl'].includes(format)) return reject(new Error(`Invalid export format '${file}'`))
    const opts = format === '.jsonl' ? false : undefined
    const transform = JSONStream.stringify(opts)
    const out = fs.createWriteStream(file)
    transform.pipe(out)
    data.forEach(transform.write)
    transform.end()

    out.on('finish', err => {
      if (err) return reject(err)
      if (!options.compress) return resolve()
      gzipping.call(this, file)
        .then(resolve, reject)
    })
    out.on('error', reject)
  })
}
