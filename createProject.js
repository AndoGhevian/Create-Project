const path = require('path')

const execa = require('execa')
const fsExtra = require('fs-extra')
const ora = require('ora');
const c = require('ansi-colors');

const readJson = fsExtra.readJson
const writeJson = fsExtra.writeJSON

const readFile = fsExtra.readFile
const writeFile = fsExtra.writeFile
const mkdirp = fsExtra.mkdirp

const exists = fsExtra.pathExists

const copy = fsExtra.copy
const move = fsExtra.move
const remove = fsExtra.remove


module.exports = async function createProject(templateFullName, projectPath) {
    const CWD = process.cwd()

    let spinner

    if (!path.isAbsolute(projectPath)) {
        projectPath = path.join(CWD, projectPath)
    }
    // console.log(templateFullName)
    // console.log(projectPath)
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

    // console.log('hey')
    spinner = ora(`Installing Template: "${templateFullName}"`).start()
    let { exitCode, stderr } = await execa.command(`npm install ${templateFullName}`, {
        cwd: projectPath,
    })
    if (exitCode) {
        spinner.fail(stderr)
        process.exit(20)
    }
    spinner.succeed('Finish Installing Template')
    // console.log('bey')

    const templatePath = path.join(projectPath, `./node_modules/${templateFullName}`)
    spinner = ora(`Coping Template...`).start();
    try {

        await copy(
            path.join(templatePath, './template'),
            projectPath,
        )
        spinner.succeed('Successfully Finish Template Coping');
    } catch (err) {
        // console.log('err.message')
        // console.log(err.message)
        spinner.fail(`Can not create project from template: ${templateFullName}`);
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

    const packageJsonExists = await exists(path.join(projectPath, `./package.json`))
    if (packageJsonExists) {
        await remove(path.join(projectPath, `./package.json`))
    }

    (
        { exitCode, stderr } = await execa.command('npm init -y', {
            cwd: projectPath,
        })
    )
    if (exitCode) {
        spinner.fail()
        console.warn(`${c.red(stderr)}`)
        process.exit(20)
    }
    // console.log('cey')

    let packageJsonData, templateData
    try {
        packageJsonData = await readJson(path.join(projectPath, './package.json'))

        templateData = await readJson(path.join(templatePath, './template.json'))
    } catch (err) {
        spinner.fail()
        console.warn(c.red(`Unable to copy package config from ${c.yellow('template.json')}`))
        process.exit(13)
    }

    // console.log('joi')
    const dependencies = (templateData.package ?? {}).dependencies
    packageJsonData.dependencies = {
        ...(packageJsonData.dependencies ?? {}),
        ...(dependencies ?? {})
    }
    // console.log('voi')
    const devDependencies = (templateData.package ?? {}).devDependencies
    packageJsonData.devDependencies = {
        ...(packageJsonData.devDependencies ?? {}),
        ...(devDependencies ?? {})
    }
    // console.log('toii')
    // console.log(templateData)
    delete templateData.package.dependencies
    delete templateData.package.devDependencies

    // console.log('noii')
    packageJsonData = {
        ...packageJsonData,
        ...templateData.package,
    }
    try {
        await writeJson(path.join(projectPath, './package.json'), packageJsonData)
    } catch (err) {
        spinner.fail()
        console.warn(c.red(`Unable to copy package config from ${c.yellow('template.json')}`))
        process.exit(13)
    }

    await remove(path.join(projectPath, `./node_modules`))
    await remove(path.join(projectPath, './package-lock.json'))

    try {
        const str = await readFile(path.join(projectPath, './README.md')).toString()
        const changedStr = str.replace(new RegExp('\{\{ProjectName\}\}', 'g'), path.basename(projectPath))
        await writeFile(path.join(projectPath, './README.md'), changedStr)
    } catch (err) {
        console.warn(c.yellow(`\nUnable to modifie {{ProjectName}}'s to "${path.basename(projectPath)}"`))
        // console.log(err)
        // console.log('err')
    }
    // console.log('goi')
    ({ exitCode, stderr } = await execa.command('npm install', {
        cwd: projectPath,
    }))
    spinner.succeed(`Project: "${path.basename(projectPath)}" successfully set up!:)`)
    if (exitCode) {
        console.warn(`\n${c.yellow(stderr)}`)
        console.warn(c.yellow('\nYou need to run npm install manually!'))
    }
    process.exit()
}