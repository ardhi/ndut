module.exports = function (err, terminate) {
  const { config } = this.ndut
  if (err && config.debug && config.argv.verbose) console.trace(err)
  if (terminate) process.exit(1)
}
