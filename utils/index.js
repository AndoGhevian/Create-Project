const execa = require('execa')

function isValidScope(val) {
    const scopeRegex = /^@[a-zA-Z0-9_\.\-]*$/
    return scopeRegex.test(val)
}

async function npmUserPackages(username) {
    const { exitCode, stdout, stderr } = await execa.command(`npm search --json ${username}`)
    if (exitCode) {
        throw new Error(stderr)
    }
    return JSON.parse(stdout)
}

function getProtocol(val) {
    try {
        return new URL(val).protocol
    }catch{
        return null
    }
}


module.exports = {
    isValidScope,
    npmUserPackages,
    getProtocol,
}