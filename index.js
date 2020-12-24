#!/usr/bin/env node

const path = require('path')

const fsExtra = require('fs-extra')
const ora = require('ora');
const c = require('ansi-colors');

const createProject = require('./createProject')
const {
  npmUserPackages,
  getProtocol,
} = require('./utils')


const store = require('./store')
const program = require('./program')


const readJson = fsExtra.readJson
const writeJson = fsExtra.writeJSON




async function main() {
  const dataJsonPath = path.join(__dirname, './data.json')
  let data
  try {
    try {
      data = await readJson(dataJsonPath)
    } catch (err) {
      data = { scope: '' }
      await writeJson(dataJsonPath, data)
    }
  } catch (err) {
    console.warn(c.red('Please Reinstall the package: npm install -g @ando_ghevian/create-project'))
    process.exit(1)
  }
  store.scope = typeof data.scope !== 'string' ? '' : data.scope
  store.username = typeof data.scope !== 'string' ? null : store.scope.replace('@', '')

  await program.parseAsync(process.argv)
  try {
    const {
      template,
      project,
      scope,
      username,

      isRun,
      isFile,
    } = store

    if (!project) {
      if (isRun || process.argv.includes('-t') || process.argv.includes('--template')) {
        console.warn(c.yellow('Please Specify project name to create with template!'))
        program.help()
      }
      process.exit()
    }

    let isNpmPackage = false
    let packageInstallUri = template
    const protocol = getProtocol(template)
    if (!protocol) {
      packageInstallUri = `${scope}/cpj-template` + (!template.length || template === '-' ? '' : `-${template}`)
      if (username === null) {
        console.warn(c.red('Please specify scope for templates!'))
        process.exit(2)
      }
      let spinner = ora(`Loading ${c.green(scope)} packages`).start();
      try {

        const packages = await npmUserPackages(username)

        const templateInfo = packages.find(pack => pack.name === packageInstallUri)
        if (!templateInfo || !templateInfo.links['npm']) {
          // console.log(templateInfo)
          spinner.fail(`Template: "${c.yellow(packageInstallUri)}" not exists!`)
          process.exit(3)
        }
        spinner.succeed(`Finish loading packages of ${c.green(scope)}`)
        isNpmPackage = true
      } catch (err) {
        spinner.fail(`Cant retrive "${c.yellow(scope)}" packages to check template!`)
        process.exit(3)
      }
    }

    await createProject(packageInstallUri, project, isNpmPackage)
    process.exit()
  } catch (err) {
    console.warn(`\n${c.red(err.message)}`)
    process.exit(10)
  }
}


main()