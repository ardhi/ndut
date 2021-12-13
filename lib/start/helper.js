const _ = require('lodash')
const fastGlob = require('fast-glob')
const luxon = require('luxon')
const fs = require('fs-extra')
const aneka = require('aneka')
const scramjet = require('scramjet')
const JSONStream = require('JSONStream')
const mixPlugins = require('../helper/mix-plugins')
const scanForRoutes = require('../helper/scan-for-routes')
const importFixture = require('../helper/import-fixture')
const getNdutConfig = require('../helper/get-ndut-config')
const parseQsForList = require('../helper/parse-qs-for-list')
const bind = require('../helper/bind')


const mod = { _, fastGlob, fs, aneka, scramjet, JSONStream, luxon }

module.exports = function (fastify) {
  const helper = bind(fastify, {
    bind,
    mixPlugins,
    scanForRoutes,
    importFixture,
    getNdutConfig,
    parseQsForList
  })
  helper._ = _
  helper.fs = fs
  helper.scramjet = scramjet
  helper.JSONStream = JSONStream
  helper.fastGlob = fastGlob
  helper.aneka = aneka

  return helper
}
