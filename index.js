#!/bin/env node

const path = require('path')

const execa = require('execa')
const fsExtra = require('fs-extra')
async function npmUserPackages(username) {
  const { exitCode, stdout, stderr } = await execa.commandSync(`npm search --json ${username}`)
  if (exitCode) {
    throw new Error(stderr)
  }
  return JSON.parse(stdout)
}

const { program } = require('commander');



const readJson = fsExtra.readJsonSync
const writeJson = fsExtra.writeJSONSync

const readFile = fsExtra.readFileSync
const writeFile = fsExtra.writeFileSync
const exists = fsExtra.existsSync
const mkdirp = fsExtra.mkdirpSync
const copy = fsExtra.copySync
const move = fsExtra.moveSync
const remove = fsExtra.removeSync

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
    // console.log(err)
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
  } catch(err) {
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

// const path = require('path')
// console.log(path.join('/home/redsky', ))

// console.log(process.cwd())