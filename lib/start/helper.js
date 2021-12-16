const _ = require('lodash')
const fastGlob = require('fast-glob')
const luxon = require('luxon')
const fs = require('fs-extra')
const fp = require('fastify-plugin')
const aneka = require('aneka')
const scramjet = require('scramjet')
const JSONStream = require('JSONStream')
const outmatch = require('outmatch')

const buildFrom = require('../helper/build-from')
const bindTo = require('../helper/bind-to')

module.exports = async function () {
  const helper = await buildFrom.call(this, `${__dirname}/../helper`, ['bind-to.js'])
  return _.extend(helper, { _, fastGlob, fs, fp, aneka, scramjet, JSONStream, luxon, outmatch, bindTo })
}
