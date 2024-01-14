const defaultExclude = require('@istanbuljs/schema/default-exclude')
const defaultExtension = require('@istanbuljs/schema/default-extension')
const findUp = require('find-up')
const { applyExtends } = require('yargs/helpers')
const { resolve, extname, basename } = require('path')
const { readFileSync } = require('fs')

const yargsConfig = {
  "usage": '$0 [opts] [script] [opts]',
  "epilog": 'visit https://git.io/vHysA for list of available reporters',
  "pkgConf": 'c8',
  "demandCommand": 1,
  "check": (argv) => {
    if (!argv.tempDirectory) {
      argv.tempDirectory = resolve(argv.reportsDir, 'tmp')
    }
    return true
  },
  "options": {
    "config": {
      alias: 'c',
      config: true,
      describe: 'path to configuration file',
      configParser: (path) => {
        const config = loadConfigFile(path)
        return applyExtends(config, process.cwd(), true)
      },
      default: () => findUp.sync(getConfigFileNames())
    },
    "reporter": {
      alias: 'r',
      group: 'Reporting options',
      describe: 'coverage reporter(s) to use',
      default: 'text'
    },
    "reports-dir": {
      alias: ['o', 'report-dir'],
      group: 'Reporting options',
      describe: 'directory where coverage reports will be output to',
      default: './coverage'
    },
    "all": {
      default: false,
      type: 'boolean',
      group: 'Reporting options',
      describe: 'supplying --all will cause c8 to consider all src files in the current working directory ' +
        'when the determining coverage. Respects include/exclude.'
    },
    "src": {
      default: undefined,
      type: 'string',
      group: 'Reporting options',
      describe: 'supplying --src will override cwd as the default location where --all looks for src files. --src can be ' +
        'supplied multiple times and each directory will be included. This allows for workspaces spanning multiple projects'
    },
    "exclude-node-modules": {
      default: true,
      type: 'boolean',
      describe: 'whether or not to exclude all node_module folders (i.e. **/node_modules/**) by default'
    },
    "include": {
      alias: 'n',
      default: [],
      group: 'Reporting options',
      describe: 'a list of specific files that should be covered (glob patterns are supported)'
    },
    "exclude": {
      alias: 'x',
      default: defaultExclude,
      group: 'Reporting options',
      describe: 'a list of specific files and directories that should be excluded from coverage (glob patterns are supported)'
    },
    "extension": {
      alias: 'e',
      default: defaultExtension,
      group: 'Reporting options',
      describe: 'a list of specific file extensions that should be covered'
    },
    "exclude-after-remap": {
      alias: 'a',
      type: 'boolean',
      default: false,
      group: 'Reporting options',
      describe: 'apply exclude logic to files after they are remapped by a source-map'
    },
    "skip-full": {
      default: false,
      type: 'boolean',
      group: 'Reporting options',
      describe: 'do not show files with 100% statement, branch, and function coverage'
    },
    "check-coverage": {
      default: false,
      type: 'boolean',
      group: 'Coverage thresholds',
      description: 'check whether coverage is within thresholds provided'
    },
    "branches": {
      default: 0,
      group: 'Coverage thresholds',
      description: 'what % of branches must be covered?',
      type: 'number'
    },
    "functions": {
      default: 0,
      group: 'Coverage thresholds',
      description: 'what % of functions must be covered?',
      type: 'number'
    },
    "lines": {
      default: 90,
      group: 'Coverage thresholds',
      description: 'what % of lines must be covered?',
      type: 'number'
    },
    "statements": {
      default: 0,
      group: 'Coverage thresholds',
      description: 'what % of statements must be covered?',
      type: 'number'
    },
    "per-file": {
      default: false,
      group: 'Coverage thresholds',
      description: 'check thresholds per file',
      type: 'boolean'
    },
    "100": {
      default: false,
      group: 'Coverage thresholds',
      description: 'shortcut for --check-coverage --lines 100 --functions 100 --branches 100 --statements 100',
      type: 'boolean'
    },
    "temp-directory": {
      describe: 'directory V8 coverage data is written to and read from',
      default: process.env.NODE_V8_COVERAGE
    },
    "clean": {
      default: true,
      type: 'boolean',
      describe: 'should temp files be deleted before script execution'
    },
    "resolve": {
      default: '',
      describe: 'resolve paths to alternate base directory'
    },
    "wrapper-length": {
      describe: 'how many bytes is the wrapper prefix on executed JavaScript',
      type: 'number'
    },
    "omit-relative": {
      default: true,
      type: 'boolean',
      describe: 'omit any paths that are not absolute, e.g., internal/net.js'
    },
    "allowExternal": {
      default: false,
      type: 'boolean',
      describe: 'supplying --allowExternal will cause c8 to allow files from outside of your cwd. This applies both to ' +
        'files discovered in coverage temp files and also src files discovered if using the --all flag.'
    },
    "merge-async": {
      default: false,
      type: 'boolean',
      describe: 'supplying --merge-async will merge all v8 coverage reports asynchronously and incrementally. ' +
        'This is to avoid OOM issues with Node.js runtime.'
    },
    "print-config": {
      default: false,
      type: 'boolean',
      describe: 'Print the derived configuration between command line parameters and loaded configuration file'
    },
    "print-config-format": {
      default: 'text',
      type: 'string',
      describe: 'Format to print the configuration in.  Accepted formats are either text or json'
    }
  }
}

function loadConfigFile (path) {
  let config = {}
  const jsExts = ['.js', '.cjs']
  const ymlExts = ['.yml', '.yaml']
  const fileName = basename(path)

  const ext = extname(path).toLowerCase()
  if (jsExts.includes(ext)) {
    config = require(path)
  } else if (ymlExts.includes(ext)) {
    config = require('js-yaml').load(readFileSync(path, 'utf8'))
  } else if (ext === '.json' || fileName.slice(-2) === 'rc') {
    config = JSON.parse(readFileSync(path, 'utf8'))
  }

  // Should the process die if none of these filename extensions are found?
  if (Object.keys(config).length === 0) {
    throw new Error(`Unsupported file type ${ext} while reading file ${path}`)
  }

  return config
}

function getConfigFileNames () {
  return [
    '.c8rc',
    '.c8rc.json',
    '.c8rc.yml',
    '.c8rc.yaml',
    '.c8rc.js',
    '.c8rc.cjs',
    '.c8.config.js',
    '.c8.config.cjs',
    'c8.config.js',
    'c8.config.cjs',
    '.nycrc',
    '.nycrc.json',
    '.nycrc.yml',
    '.nycrc.yaml',
    '.nyc.config.js',
    '.nyc.config.cjs',
    'nyc.config.js',
    'nyc.config.cjs'
  ]
}

module.exports = { yargsConfig }