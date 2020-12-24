const { program } = require('commander');

const actions = require('./actions')


program
    .usage('[[[command] options] project]')

program.command('run [projects...]', { isDefault: true, hidden: true })
    .option('-t, --template [value]', 'Project Template scoped to specified user(org)', '')
    .action(actions.run)

program
    .command('use <scope> [project...]')
    .usage('<scope> [[options] project]')
    .description('Specify scope to pull tempalates from. (same as: scope use)')
    .option('-t, --template [value]', 'Project Template scoped to specified user(org)', '')
    .action(actions.useScope)




const scopeCmd = program.command('scope')
    .description('Manage scope for templates')

scopeCmd
    .command('set <scope> [project...]')
    .usage('<scope> [options project]')
    .description('Set scope for create-project, to pull tempalates from.')
    .option('-t, --template [value]', 'Project Template scoped to specified user(org)', '')
    .action(actions.setScope)

scopeCmd
    .command('get')
    .description('Get current scope from which it pull tempalates.')
    .action(actions.getScope)

scopeCmd
    .command('use <scope> [project...]')
    .usage('<scope> [[options] project]')
    .description('Specify scope to pull tempalates from. (Same as: use)')
    .option('-t, --template [value]', 'Project Template scoped to specified user(org)', '')
    .action(actions.useScope)


module.exports = program