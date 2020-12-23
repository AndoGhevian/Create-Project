const execa = require('execa')


function isValidScope(val) {
    const scopeRegex = /^@[a-zA-Z0-9_\.\-]*$/
    return scopeRegex.test(val)
}

async function npmUserPackages(username) {
    const { exitCode, stdout, stderr } = await execa.commandSync(`npm search --json ${username}`)
    if (exitCode) {
        throw new Error(stderr)
    }
    return JSON.parse(stdout)
}


module.exports = {
    isValidScope,
    npmUserPackages,
}