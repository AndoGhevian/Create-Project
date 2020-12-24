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
        const url = new Url(val)
        return url.protocol
    }catch{}

    try {
        const [protocol] = /^.*?:\/\//.exec(val)
        const splitSlashes = protocol.slice(0, -2)
        return !splitSlashes || splitSlashes === ':' ? null : splitSlashes
    } catch (err) {
        console.log(err)
        return null
    }
}


module.exports = {
    isValidScope,
    npmUserPackages,
    getProtocol,
}