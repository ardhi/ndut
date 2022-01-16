const kleur = require('kleur')

const readline = require('readline-promise').default
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

module.exports = async function (q, options = {}) {
  return rl.questionAsync(kleur.grey(options.loggerName || '[Ndut]') + ' ' + kleur[options.color || 'white']().bold(q) + '')
}
