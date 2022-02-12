module.exports = function (error) {
  const { _ } = this.ndut.helper
  if (!error.isBoom) {
    let data = null
    if (error.validation) {
      const data = {}
      _.each(error.validation, err => {
        data[_.values(err.params)[0]] = err.keyword
      })
      error = this.Boom.badData(_.get(error, 'validationError'), data)
    } else if (_.get(error, 'details.codes')) {
      data = {}
      _.forOwn(error.details.codes, (v, k) => {
        data[k] = v[0]
      })
      error = this.Boom.badData(_.get(error, 'submissionError'), data)
    } else {
      error = this.Boom.boomify(error)
      error.reformat()
    }
  }
  return error
}
