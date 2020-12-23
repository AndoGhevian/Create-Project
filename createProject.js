const path = require('path')

const execa = require('execa')
const fsExtra = require('fs-extra')


const readJson = fsExtra.readJsonSync
const writeJson = fsExtra.writeJSONSync

const readFile = fsExtra.readFileSync
const writeFile = fsExtra.writeFileSync
const mkdirp = fsExtra.mkdirpSync

const exists = fsExtra.existsSync

const copy = fsExtra.copySync
const move = fsExtra.moveSync
const remove = fsExtra.removeSync


module.exports = async function createProject(templateFullName, projectPath) {
    const CWD = process.cwd()

    if (!path.isAbsolute(projectPath)) {
        projectPath = path.join(CWD, projectPath)
    }
    // console.log(templateFullName)
    // console.log(projectPath)
    try {
        mkdirp(projectPath, {
            recursive: true
        })
    } catch (err) {
        console.warn(`Can not create project folder: ${projectPath}`)
        process.exit(11)
    }

    // console.log('hey')
    let { exitCode, stderr } = execa.commandSync(`npm install ${templateFullName}`, {
        cwd: projectPath,
    })
    if (exitCode) {
        console.warn(stderr)
        process.exit(20)
    }
    // console.log('bey')

    const templatePath = path.join(projectPath, `./node_modules/${templateFullName}`)
    try {
        copy(
            path.join(templatePath, './template'),
            projectPath,
        )
    } catch (err) {
        console.log('err.message')
        console.log(err.message)
        console.warn(`Can not create project from template: ${templateFullName}`)
        process.exit(12)
    }

    // console.log('mey')
    move(
        path.join(projectPath, './gitignore'),
        path.join(projectPath, './.gitignore')
    )

    const packageJsonExists = exists(path.join(projectPath, `./package.json`))
    if (packageJsonExists) {
        remove(path.join(projectPath, `./package.json`))
    }

    (
        { exitCode, stderr } = execa.commandSync('npm init -y', {
            cwd: projectPath,
        })
    )
    if (exitCode) {
        console.warn(stderr)
        process.exit(20)
    }
    // console.log('cey')

    let packageJsonData = readJson(path.join(projectPath, './package.json'))

    const templateData = readJson(path.join(templatePath, './template.json'))
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
    writeJson(path.join(projectPath, './package.json'), packageJsonData)

    fsExtra.removeSync(path.join(projectPath, `./node_modules`))
    fsExtra.removeSync(path.join(projectPath, './package-lock.json'))

    try {
        const str = readFile(path.join(projectPath, './README.md')).toString()
        const changedStr = str.replace(new RegExp('\{\{ProjectName\}\}', 'g'), path.basename(projectPath))
        writeFile(path.join(projectPath, './README.md'), changedStr)
    } catch (err) {
        // console.log(err)
        // console.log('err')
    }
    // console.log('goi')
    try {
        (
            { exitCode, stderr } = execa.commandSync('npm install', {
                cwd: projectPath,
            })
        )
        if (exitCode) {
            console.warn(stderr)
            process.exit(20)
        }
        console.info('Project successfully set up!:)')
    } catch (err) {
        console.warn('You need to run npm install manually!')
    }
    process.exit()
}