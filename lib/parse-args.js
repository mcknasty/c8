const { yargsConfig } = require('./yargs-config')
const Yargs = require('yargs/yargs')
const parser = require('yargs-parser')

function buildYargs (withCommands = false) {
    const { usage, pkgConf, demandCommand, check, epilog, options } = yargsConfig
    const yargs = Yargs([])
    yargs.usage(usage)
    Object.keys(options).forEach(v => {
      yargs.option(v, options[v])
    })
    yargs.pkgConf(pkgConf)
    yargs.demandCommand(demandCommand)
    yargs.check(check)
    yargs.epilog(epilog)

  // TODO: enable once yargs upgraded to v17: https://github.com/bcoe/c8/pull/332#discussion_r721636191
  // yargs.middleware((argv) => {
  //   if (!argv['100']) return argv

  //   return {
  //     ...argv,
  //     branches: 100,
  //     functions: 100,
  //     lines: 100,
  //     statements: 100,
  //   }
  // })

  const checkCoverage = require('./commands/check-coverage')
  const report = require('./commands/report')
  if (withCommands) {
    yargs.command(checkCoverage)
    yargs.command(report)
  } else {
    yargs.command(checkCoverage.command, checkCoverage.describe)
    yargs.command(report.command, report.describe)
  }

  let argv = process.argv.slice(2)
  const checkArgs = parser(argv)

  if ( Boolean(checkArgs['print-config']) === true ) {
    args = yargs.parse(hideInstrumenteeArgs())
    jsonYargs = JSON.stringify(args, indent=2)
    console.log(jsonYargs)
    process.exit()
  }
  return yargs
}

function hideInstrumenterArgs (yargv) {
  let argv = process.argv.slice(1)
  argv = argv.slice(argv.indexOf(yargv._[0]))
  if (argv[0][0] === '-') {
    argv.unshift(process.execPath)
  }
  return argv
}

function hideInstrumenteeArgs () {
  let argv = process.argv.slice(2)
  const yargv = parser(argv)

  if (!yargv._.length) return argv

  // drop all the arguments after the bin being
  // instrumented by c8.
  argv = argv.slice(0, argv.indexOf(yargv._[0]))
  argv.push(yargv._[0])

  return argv
}

module.exports = {
  buildYargs,
  hideInstrumenterArgs,
  hideInstrumenteeArgs
}
