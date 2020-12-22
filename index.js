#!/bin/env node

const path = require('path')

const execa = require('execa')
const fsExtra = require('fs-extra')
async function npmUserPackages(username) {
  const { stdout } = await execa.commandSync(`npm search --json ${username}`)
  return JSON.parse(stdout)
}

const { program } = require('commander');



const readJson = fsExtra.readJsonSync
const writeJson = fsExtra.writeJSONSync

const mkdirp = fsExtra.mkdirpSync
const copy = fsExtra.copySync
const move = fsExtra.moveSync
const exists = fsExtra.existsSync

async function main() {
  program.version('0.0.1')
    .option('-t, --template [value]', 'Project Template scoped to specified user(org)', '')

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
  let scope = typeof data.scope !== 'string' ? '' : data.scope
  const username = typeof data.scope !== 'string' ? null : scope.replace('@', '')


  program.parse()
  if (program.template) {
    try {
      const templateName = program.template.trim()
      const templateFullName = `${scope}/cpj-template` + (!templateName.length || templateName === '-' ? '' : `-${templateName}`)
      if (username === null) {
        console.warn('Please specify scope for templates!')
        process.exit(2)
      }
      const packages = await npmUserPackages(username)
      const templateInfo = packages.find(pack => pack.name === templateFullName)
      if (!templateInfo || !templateInfo.links['npm']) {
        // console.log(templateInfo)
        console.warn(`Template: "${templateName}" not exists under scope: "${scope}"`)
        process.exit(3)
      }

      if (program.args.length < 1) {
        console.warn('Please Specify project name to create with template!')
        exit(4)
      } else if (program.args.length > 1) {
        console.warn('Currently you can specify single project to create from template!')
        exit(4)
      }
      await createProject(templateFullName, program.args[0])
      process.exit()
    } catch (err) {
      console.log(err.message)
      process.exit(10)
    }
  }

  const scopeCmd = program.command('scope')
    .description('Manage scope for templates')


  scopeCmd
    .command('set <username>')
    .description('Set scope for create-project, to pull tempalates from.')
    .action(async (newScope) => {
      if (!isValidScope(newScope)) {
        console.warn('Invalid scope provided!')
        process.exit(5)
      }

      // const username = newScope.replace('@', '')
      // console.log(username)
      // try {
      //   const userInfo = await npmUser(username)
      // } catch (err) {
      //   console.log(err)
      //   console.warn(`user: "${username}" not exists.`)
      //   process.exit(3)
      // }

      scope = newScope
      data = { scope }
      writeJson(dataJsonPath, data)

      console.info(scope)
      process.exit()
    })


  scopeCmd
    .command('get')
    .description('Get current scope from which it pull tempalates.')
    .action(() => {
      console.info(scope)
      process.exit()
    })

  await program.parseAsync(process.argv)
}

main()

function isValidScope(val) {
  const scopeRegex = /^@[a-zA-Z0-9_\.\-]*$/
  return scopeRegex.test(val)
}


async function createProject(templateFullName, projectPath) {
  const CWD = process.cwd()

  if (!path.isAbsolute(projectPath)) {
    projectPath = path.join(CWD, projectPath)
  }
  try {
    mkdirp(projectPath, {
      recursive: true
    })
  } catch (err) {
    console.warn(`Can not create project folder: ${projectPath}`)
    process.exit(11)
  }

  let { exitCode, stderr } = execa.commandSync(`npm i ${templateFullName}`, {
    cwd: projectPath,
  })
  if (!exitCode) {
    console.warn(stderr)
    process.exit(12)
  }

  const templatePath = path.join(projectPath, `./node_modules/${templateFullName}/template`)
  try {
    copy(
      templatePath,
      path.join(projectPath),
    )
  } catch (err) {
    console.warn(`Can not create project from template: ${templateFullName}`)
    process.exit(13)
  }

  move(
    path.join(projectPath, './gitignore'),
    path.join(projectPath, './.gitignore')
  )

  const exists = exists(`${projectPath}/package.json`)
  if (!exists) {
    execa.commandSync('npm init -y', {
      cwd: CWD
    })
  }

  const packageJsonData = readJson(path.join(projectPath, './package.json'))

  const templateData = readJson(path.join(templatePath, './template.json'))

  const dependencies = (templateData.packages ?? {}).dependencies
  packageJsonData.dependencies = {
    ...(packageJsonData.dependencies ?? {}),
    ...(dependencies ?? {})
  }
  const devDependencies = (templateData.packages ?? {}).devDependencies
  packageJsonData.devDependencies = {
    ...(packageJsonData.devDependencies ?? {}),
    ...(devDependencies ?? {})
  }
  delete templateData.packages.dependencies
  delete templateData.packages.devDependencies

  packageJsonData = {
    ...packageJsonData,
    ...templateData.packages,
  }
  writeJson(path.join(projectPath, './package.json', packageJsonData))

  fsExtra.removeSync(path.join(projectPath, `./node_modules`))
  fsExtra.removeSync(projectPath, './package-lock.json')

  try {
    execa.commandSync('npm install', {
      cwd: CWD
    })
    console.info('Project successfully set up!:)')
  } catch (err) {
    console.warn('You need to run npm install manually!')
  }
  process.exit()
}

// const path = require('path')
// console.log(path.join('/home/redsky', ))

// console.log(process.cwd())