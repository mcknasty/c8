const { readFileSync } = require('fs')
const { extname, basename } = require('path')

const CONFIG_FILE_NAMES = Object.freeze([
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
])

const EXTS_JS_VALIDATOR = /\.c?js$/i
const EXTS_YAML_VALIDATOR = /\.ya?ml$/i

class UnsupportedFileTypeError extends Error {
  constructor (path) {
    super(
      `Unsupported file type ${extname(
        path
      ).toLowerCase()} while reading file ${path}`
    )
    this.name = UnsupportedFileTypeError.name
  }
}

class ConfigParsingError extends Error {
  constructor (path, errorDetails, originalError) {
    super(
      `Error loading configuration from file ${path}: ${errorDetails}` +
        (typeof originalError === 'object' && originalError instanceof Error
          ? ` Original error: ${originalError.message}`
          : '')
    )

    this.name = UnsupportedFileTypeError.name

    if (originalError instanceof Error) {
      this.stack = originalError.stack
    }
  }
}

const NO_EXPORTS = Symbol('no exports')

function loadConfigFile (path, _di) {
  const di = {
    readFile: (path) => readFileSync(path, 'utf8'),
    readJs: (path) => require(path),
    ..._di
  }

  let config

  const fileName = basename(path)
  const ext = extname(path).toLowerCase()

  if (EXTS_YAML_VALIDATOR.test(ext)) {
    const JsYaml = require('js-yaml')
    try {
      // TODO: add YAML schema so that we get better errors for YAML users.
      config = JsYaml.load(di.readFile(path))
    } catch (error) {
      if (typeof error === 'object') {
        if (error instanceof JsYaml.YAMLException) {
          throw new ConfigParsingError(
            path,
            'must contain a valid c8 configuration object.',
            error
          )
        }
      }

      throw error
    }

    if (!config) {
      // TODO: remove this check once we get YAML schema validation.
      throw new ConfigParsingError(path, 'invalid configuration')
    }
  } else {
    if (EXTS_JS_VALIDATOR.test(ext)) {
      // Add a loader that allows us to check to see if anything was ever exported.
      // Thank you to https://stackoverflow.com/a/70999950 for the inspiration. Please note that this code won't port to TypeScript nicely.
      const extensions = module.constructor._extensions
      const cjsLoader = extensions['.cjs']
      const jsLoader = extensions['.js']
      extensions['.cjs'] = extensions['.js'] = (module, filename) => {
        module.exports[NO_EXPORTS] = filename
        jsLoader(module, filename)
      }
      try {
        config = di.readJs(path)
      } finally {
        // Undo the global state mutation, even if an error was thrown.
        extensions['.cjs'] = cjsLoader
        extensions['.js'] = jsLoader
      }
      if (NO_EXPORTS in config) {
        throw new ConfigParsingError(
          path,
          'does not export a c8 configuration object.'
        )
      }
    } else if (ext === '.json' || fileName.slice(-2) === 'rc') {
      try {
        config = JSON.parse(di.readFile(path))
      } catch (error) {
        if (typeof error === 'object') {
          if (error instanceof SyntaxError) {
            throw new ConfigParsingError(
              path,
              'must contain a valid c8 configuration object.',
              error
            )
          }
        }

        throw error
      }
    } else {
      // If the user supplied a bad configuration file that we can't figure out how to read, then it's on them to solve it.
      // Attempting to use some other config, even a default one, will result in unexpected behavior: aka ignoring the config that was explicitly specified is not intuitive.
      throw new UnsupportedFileTypeError(
        `Unsupported file type ${ext} while reading file ${path}`
      )
    }

    // TODO: validate the object schema so that we get validation of JS-like configs
  }

  return config
}

module.exports = {
  CONFIG_FILE_NAMES,
  loadConfigFile,
  ConfigParsingError,
  UnsupportedFileTypeError
}
