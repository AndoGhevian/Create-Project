const path = require('path')

const execa = require('execa')
const fsExtra = require('fs-extra')
const ora = require('ora');
const c = require('ansi-colors');

const {
    getProtocol,
} = require('./utils')


const readJson = fsExtra.readJson
const writeJson = fsExtra.writeJSON

const readFile = fsExtra.readFile
const writeFile = fsExtra.writeFile
const mkdirp = fsExtra.mkdirp

const exists = fsExtra.pathExists

const copy = fsExtra.copy
const move = fsExtra.move
const remove = fsExtra.remove


module.exports = async function createProject(packageInstallUri, projectPath, isNpmPackage) {
    const CWD = process.cwd()

    let spinner, exitCode, stderr

    if (!path.isAbsolute(projectPath)) {
        projectPath = path.join(CWD, projectPath)
    }

    const projectExists = await exists(projectPath)
    if (projectExists) {
        console.warn(c.red(`Project folder: ${c.yellow(path.basename(projectPath))} allready exists!`))
        process.exit(11)
    }

    try {
        await mkdirp(projectPath, {
            recursive: true
        })
    } catch (err) {
        console.warn(c.red(`Can not create project folder: ${projectPath}`))
        process.exit(11)
    }

    ({ exitCode, stderr } = await execa.command('npm init -y', {
        reject: false,
        cwd: projectPath,
    }))
    if (exitCode) {
        try {
            await remove(projectPath)
        } catch { }
        console.warn(`${c.red(stderr)}`)
        process.exit(20)
    }

    let normalizedInstallUri = packageInstallUri
    if (getProtocol(packageInstallUri) === 'file:') {
        const tmpPath = packageInstallUri.replace('file:', '')
        if (!path.isAbsolute(tmpPath)) {
            normalizedInstallUri = path.join(CWD, tmpPath)
        }
    }
    spinner = ora(`Installing Template: "${packageInstallUri}"`).start();
    ({ exitCode, stderr } = await execa.command(`npm install ${normalizedInstallUri}`, {
        reject: false,
        cwd: projectPath,
    }))
    if (exitCode) {
        try {
            await remove(projectPath)
        } catch { }
        spinner.fail(stderr)
        process.exit(20)
    }
    spinner.succeed('Finish Installing Template')
    // console.log('bey')

    let packageFullName, templatePath
    spinner = ora(`Coping Template...`).start()
    try {
        const packageJson = await readJson(path.join(projectPath, './package.json'))
        packageFullName = Object.keys(packageJson['dependencies'])[0]
        templatePath = path.join(projectPath, `./node_modules/${packageFullName}`)
        await remove(path.join(projectPath, './package.json'))
        await remove(path.join(projectPath, './package-lock.json'))

        const ignore = {
            packageJson: path.join(templatePath, './package.json'),
            packageLockJson: path.join(templatePath, './package-lock.json'),
            node_modules: path.join(templatePath, './node_modules'),
        }
        // console.log(templatePath)
        await copy(
            path.join(templatePath, './template'),
            projectPath,
            {
                dereference: true,
                filter: (src) => Object.values(ignore).every(p => src !== p),
            }
        )
        spinner.succeed('Successfully Finish Template Coping');
    } catch (err) {
        try {
            await remove(projectPath)
        } catch { }
        spinner.fail(`Can not create project from template: ${packageInstallUri}`);
        process.exit(12)
    }

    // console.log('mey')
    spinner = ora('Doing Some initialization Stuff...').start()
    try {
        await move(
            path.join(projectPath, './gitignore'),
            path.join(projectPath, './.gitignore')
        )
    } catch { }

    ({ exitCode, stderr } = await execa.command('npm init -y', {
        reject: false,
        cwd: projectPath,
    }))
    if (exitCode) {
        try {
            await remove(projectPath)
        } catch { }
        spinner.fail()
        console.warn(`${c.red(stderr)}`)
        process.exit(20)
    }
    // console.log('cey')

    let packageJson, templateData
    try {
        packageJson = await readJson(path.join(projectPath, './package.json'))
        templateData = await readJson(path.join(templatePath, './template.json'))
    } catch (err) {
        try {
            await remove(projectPath)
        } catch { }
        spinner.fail()
        console.warn(c.red(`Unable to copy package config from ${c.yellow('template.json')}`))
        process.exit(13)
    }

    // console.log('joi')
    const dependencies = (templateData.package ?? {}).dependencies
    packageJson.dependencies = {
        ...(packageJson.dependencies ?? {}),
        ...(dependencies ?? {})
    }
    // console.log('voi')
    const devDependencies = (templateData.package ?? {}).devDependencies
    packageJson.devDependencies = {
        ...(packageJson.devDependencies ?? {}),
        ...(devDependencies ?? {})
    }
    // console.log('toii')
    // console.log(templateData)
    delete templateData.package.dependencies
    delete templateData.package.devDependencies

    // console.log('noii')
    packageJson = {
        ...packageJson,
        ...templateData.package,
    }
    try {
        await writeJson(path.join(projectPath, './package.json'), packageJson)
    } catch (err) {
        try {
            await remove(projectPath)
        } catch { }
        spinner.fail()
        console.warn(c.red(`Unable to copy package config from ${c.yellow('template.json')}`))
        process.exit(13)
    }

    try {
        await remove(path.join(projectPath, `./node_modules`))
    } catch { }

    try {
        const str = (await readFile(path.join(projectPath, './README.md'))).toString()
        const changedStr = str.replace(new RegExp('\{\{ProjectName\}\}', 'g'), path.basename(projectPath))
        await writeFile(path.join(projectPath, './README.md'), changedStr)
    } catch (err) {
        console.warn(c.yellow(`\nUnable to modifie {{ProjectName}}'s in README.md to "${path.basename(projectPath)}"`))
    }
    // console.log('goi')
    ({ exitCode, stderr } = await execa.command('npm install', {
        reject: false,
        cwd: projectPath,
    }))
    spinner.succeed(`Project: "${path.basename(projectPath)}" successfully set up!:)`)
    if (exitCode) {
        console.warn(`\n${c.yellow(stderr)}`)
        console.warn(c.yellow('\nYou need to run npm install manually!'))
    }
    process.exit()
}