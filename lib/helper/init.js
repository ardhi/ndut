const _ = require('lodash')
const fastGlob = require('fast-glob')
const luxon = require('luxon')
const fs = require('fs-extra')
const mime = require('mime')
const fp = require('fastify-plugin')
const aneka = require('aneka')
const scramjet = require('scramjet')
const JSONStream = require('JSONStream')
const outmatch = require('outmatch')
const queryString = require('query-string')
const lockfile = require('proper-lockfile')
const buildHelper = require('./build-helper')
const bindTo = require('./bind-to')
const through = require('through')
const through2 = require('through2')

module.exports = async function () {
  const helper = await buildHelper.call(this, `${__dirname}/../helper`, ['bind-to.js'])
  return _.extend(helper, { _, fastGlob, fs, fp, aneka, scramjet, JSONStream, luxon,
    outmatch, bindTo, lockfile, mime, queryString, through, through2
  })
}
