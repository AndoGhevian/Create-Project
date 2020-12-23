#!/bin/env node

const path = require('path')

const fsExtra = require('fs-extra')

const createProject = require('./createProject')
const {
  isValidScope,
  npmUserPackages,
} = require('./utils')


const readJson = fsExtra.readJsonSync
const writeJson = fsExtra.writeJSONSync

const { program } = require('commander');


async function main() {
  let template, project, scope, username, isRun = false
  const useScopeHandler = (newScope, projects, options) => {

    if (!isValidScope(newScope)) {
      console.warn('Invalid scope provided!')
      process.exit(5)
    }

    template = options.template
    project = projects[0]
    scope = newScope
    username = scope.replace('@', '')
    console.info(scope)
  }


  const dataJsonPath = path.join(__dirname, './data.json')
  let data
  try {
    try {
      data = readJson(dataJsonPath)
    } catch (err) {
      data = { scope: '' }
      writeJson(dataJsonPath, data)
    }
  } catch (err) {
    console.warn('Please Reinstall the package: npm install -g @ando_ghevian/create-project')
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
        console.warn('No scope specified!')
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
    .action((newScope, projects, options) => {
      project = projects[0]

      if (!isValidScope(newScope)) {
        console.warn('Invalid scope provided!')
        process.exit(5)
      }

      template = options.template
      project = projects[0]
      scope = newScope
      username = scope.replace('@', '')

      data = { scope }
      writeJson(dataJsonPath, data)

      console.info(scope)
    })

  scopeCmd
    .command('get')
    .description('Get current scope from which it pull tempalates.')
    .action(() => {
      console.info(scope)
      process.exit()
    })

  scopeCmd
    .command('use <scope> [project...]')
    .usage('<scope> [options project]')
    .description('Specify scope to pull tempalates from. (Same as: use)')
    .option('-t, --template [value]', 'Project Template scoped to specified user(org)', '')
    .action(useScopeHandler)

  program.parse(process.argv)
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
      if(isRun || process.argv.includes('-t') || process.argv.includes('-template')) {
        console.warn('Please Specify project name to create with template!')
        program.help()
      }
      process.exit()
    }
    // console.log('processing...')
    const templateName = template.trim()
    const templateFullName = `${scope}/cpj-template` + (!templateName.length || templateName === '-' ? '' : `-${templateName}`)
    if (username === null) {
      console.warn('Please specify scope for templates!')
      process.exit(2)
    }
    const packages = await npmUserPackages(username)
    const templateInfo = packages.find(pack => pack.name === templateFullName)
    if (!templateInfo || !templateInfo.links['npm']) {
      // console.log(templateInfo)
      console.warn(`Template: "${templateFullName}" not exists!`)
      process.exit(3)
    }

    await createProject(templateFullName, project)
    process.exit()
  } catch (err) {
    console.warn(err.message)
    process.exit(10)
  }
}


main()