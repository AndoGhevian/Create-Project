#!/usr/bin/env node

const path = require('path')

const fsExtra = require('fs-extra')
const ora = require('ora');
const c = require('ansi-colors');

const createProject = require('./createProject')
const {
  isValidScope,
  npmUserPackages,
} = require('./utils')


const readJson = fsExtra.readJson
const writeJson = fsExtra.writeJSON

const { program } = require('commander');


async function main() {
  let template, project, scope, username, isRun = false
  const useScopeHandler = (newScope, projects, options) => {

    if (!isValidScope(newScope)) {
      console.warn(c.red('Invalid scope provided!'))
      process.exit(5)
    }

    template = options.template
    project = projects[0]
    scope = newScope
    username = scope.replace('@', '')
    console.info(c.cyanBright(scope))
  }


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
  scope = typeof data.scope !== 'string' ? '' : data.scope
  username = typeof data.scope !== 'string' ? null : scope.replace('@', '')


  program
    .usage('[[command] options project]')


  program.command('run [projects...]', { isDefault: true, hidden: true })
    .option('-t, --template [value]', 'Project Template scoped to specified user(org)', '')
    .action((projects, options) => {
      isRun = true
      if (!scope) {
        console.warn(c.red('No scope specified!'))
        program.help()
      }
      // if (!options.template) {
      //   console.warn('No Template specified!')
      //   program.help()
      // }

      template = options.template
      project = projects[0]
      username = scope.replace('@', '')
    })


  program
    .command('use <scope> [project...]')
    .usage('<scope> [options project]')
    .description('Specify scope to pull tempalates from. (same as: scope use)')
    .option('-t, --template [value]', 'Project Template scoped to specified user(org)', '')
    .action(useScopeHandler)


  const scopeCmd = program.command('scope')
    .description('Manage scope for templates')

  scopeCmd
    .command('set <scope> [project...]')
    .usage('<scope> [options project]')
    .description('Set scope for create-project, to pull tempalates from.')
    .option('-t, --template [value]', 'Project Template scoped to specified user(org)', '')
    .action(async (newScope, projects, options) => {
      project = projects[0]

      if (!isValidScope(newScope)) {
        console.warn(c.red('Invalid scope provided!'))
        process.exit(5)
      }

      template = options.template
      project = projects[0]
      scope = newScope
      username = scope.replace('@', '')

      data = { scope }
      await writeJson(dataJsonPath, data)

      console.info(c.cyanBright(scope))
    })

  scopeCmd
    .command('get')
    .description('Get current scope from which it pull tempalates.')
    .action(() => {
      console.info(c.cyanBright(scope))
      process.exit()
    })

  scopeCmd
    .command('use <scope> [project...]')
    .usage('<scope> [options project]')
    .description('Specify scope to pull tempalates from. (Same as: use)')
    .option('-t, --template [value]', 'Project Template scoped to specified user(org)', '')
    .action(useScopeHandler)

  await program.parseAsync(process.argv)
  // console.log('template')
  // console.log(template)
  // console.log()
  // console.log('project')
  // console.log(project)
  // console.log()
  // console.log('scope')
  // console.log(scope)
  // console.log()
  // console.log('username')
  // console.log(username)
  try {
    // console.log('processingBefore->')
    if (!project) {
      if (isRun || process.argv.includes('-t') || process.argv.includes('-template')) {
        console.warn(c.yellow('Please Specify project name to create with template!'))
        program.help()
      }
      process.exit()
    }
    // console.log('processing...')
    const templateName = template.trim()
    const templateFullName = `${scope}/cpj-template` + (!templateName.length || templateName === '-' ? '' : `-${templateName}`)
    if (username === null) {
      console.warn(c.red('Please specify scope for templates!'))
      process.exit(2)
    }
    let spinner = ora(`Loading ${c.green(scope)} packages`).start();
    try {

      const packages = await npmUserPackages(username)

      const templateInfo = packages.find(pack => pack.name === templateFullName)
      if (!templateInfo || !templateInfo.links['npm']) {
        // console.log(templateInfo)
        spinner.fail(`Template: "${c.yellow(templateFullName)}" not exists!`)
        process.exit(3)
      }
      spinner.succeed(`Finish loading packages of ${c.green(scope)}`)
    } catch (err) {
      spinner.fail(`Cant retrive "${c.yellow(scope)}" packages to check template!`)
      process.exit(3)
    }

    await createProject(templateFullName, project)
    process.exit()
  } catch (err) {
    console.warn(`\n${c.red(err.message)}`)
    process.exit(10)
  }
}


main()