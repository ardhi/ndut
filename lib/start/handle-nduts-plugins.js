const _ = require('lodash')

const result = []


module.exports = async function (config, plugins) {
  const { _, getNdutConfig, arrayToTree, aneka } = this.ndut.helper

  // TODO: it doesn't work !!!
  /*
  const registerTree = async (scope, items) => {
    for (const item of items) {
      const options = getNdutConfig(item.name)
      await scope.register(item.handler, options)
      if (item.children.length > 0) {
        const newScope = this[options.instanceName].ctx
        await registerTree(newScope, item.children)
      }
    }
  }

  const tree = arrayToTree(plugins, { id: 'name', parentId: 'parent', dataField: null })
  await registerTree(this, tree)
  */
  for (const p of plugins) {
    const options = getNdutConfig(p.name)
    if (options.disablePlugin) this.log.warn(`Plugin '${n}' is disabled`)
    else {
      this.log.info(`Register '${p.name}'`)
      await this.register(p.handler, options)
    }
  }
}
