const fsExtra = require('fs-extra')
const c = require('ansi-colors');

const store = require('../store')
const {
    getProtocol,
    isValidScope,
} = require('../utils')


const writeJson = fsExtra.writeJSON


function run(projects, options) {
    store.isRun = true
    store.template = options.template.trim()
    store.project = projects[0]

    const protocol = getProtocol(store.template)
    if (protocol) {
        if (protocol === 'file:') {
            store.isFile = true
        }
        return
    }

    if (!store.scope) {
        console.warn(c.red('No scope specified!'))
        program.help()
    }
    store.username = store.scope.replace('@', '')
}


function getScope() {
    console.info(c.cyanBright(store.scope))
    process.exit()
}

function useScope(newScope, projects, options) {
    if (!isValidScope(newScope)) {
        console.warn(c.red('Invalid scope provided!'))
        process.exit(5)
    }

    store.template = options.template.trim()
    store.project = projects[0]
    store.scope = newScope
    store.username = scope.replace('@', '')
    console.info(c.cyanBright(store.scope))
}

async function setScope(newScope, projects, options) {
    if (!isValidScope(newScope)) {
        console.warn(c.red('Invalid scope provided!'))
        process.exit(5)
    }

    store.template = options.template.trim()
    store.project = projects[0]
    store.scope = newScope
    store.username = scope.replace('@', '')

    const data = { scope: store.scope }
    try {
        await writeJson(dataJsonPath, data)
    } catch (err) {
        console.warn(c.red('Unable to change Scope!'))
        process.exit(5)
    }

    console.info(c.cyanBright(store.scope))
}


module.exports = {
    getScope,
    run,
    useScope,
    setScope,
}