module.exports = async function () {
  const { _, buildRoutes } = this.ndut.helper
  const { config } = this

  this.log.info('Global routes')
  const scanDirs = [{ dir: `${config.dir.base}/route`, options: { root: 'cwd' } }]
  await buildRoutes(this, '', scanDirs)
}
