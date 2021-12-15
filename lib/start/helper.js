const _ = require('lodash')
const fastGlob = require('fast-glob')
const luxon = require('luxon')
const fs = require('fs-extra')
const fp = require('fastify-plugin')
const aneka = require('aneka')
const scramjet = require('scramjet')
const JSONStream = require('JSONStream')
const outmatch = require('outmatch')

const mixPlugins = require('../helper/mix-plugins')
const scanForRoutes = require('../helper/scan-for-routes')
const importFixture = require('../helper/import-fixture')
const getNdutConfig = require('../helper/get-ndut-config')
const parseQsForList = require('../helper/parse-qs-for-list')
const bind = require('../helper/bind')


module.exports = function (fastify) {
  const helper = bind(fastify, {
    bind,
    mixPlugins,
    scanForRoutes,
    importFixture,
    getNdutConfig,
    parseQsForList
  })
  return _.extend(helper, { _, fastGlob, fs, fp, aneka, scramjet, JSONStream, luxon, outmatch })
}
