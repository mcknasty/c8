const { readFileSync } = require('fs')
const { extname, basename } = require('path')
const JsYaml = require('js-yaml')

const {
  UnsupportedFileTypeError,
  ConfigParsingError
} = require('./error-reporting')

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

const JS_EXTS = Object.freeze(['.js', '.cjs'])
const JSON_EXTS = Object.freeze(['.json'])
const YAML_EXTS = Object.freeze(['.yml', '.yaml'])

const NO_EXPORTS = Symbol('no exports')

/**
 * Loads a configuration file of whatever format from the given path.
 *
 * @param {string} path The path to load the configuration from.
 * @param {readFile(path: string) => string, readJs(path: string) => C8Config} [_di] For test suite use only. Do not use.
 * @returns {object} An object containing
 * @throws {UnsupportedFileTypeError} When the given configuration file is of a type that is unsupported.
 * @throws {ConfigParsingError} When the configuration file fails to be read. E.g. a syntax error, such as not using quoted keys in JSON.
 */
function loadConfigFile (path, _di) {
  const di = {
    // A variation of the Dependency Injection pattern that allows the test suites to overide any of these functions with mocks.
    readFile: (path) => readFileSync(path, 'utf8'),
    readJs: (path) => require(path),
    ..._di // Note that making the DI argument a hidden argument by using the `arguments` array isn't a viable option in TypeScript, so this has been written in a way that is compatible with that.
  }

  let config

  const fileName = basename(path)
  const ext = extname(path).toLowerCase()

  if (YAML_EXTS.includes(ext)) {
    try {
      // TODO: add YAML schema so that we get better errors for YAML users.
      config = JsYaml.load(di.readFile(path))
    } catch (error) {
      if (error instanceof JsYaml.YAMLException) {
        throw new ConfigParsingError(
          path,
          'must contain a valid c8 configuration object.',
          error
        )
      }

      throw error
    }

    if (!config) {
      // TODO: remove this check once we get YAML schema validation.
      throw new ConfigParsingError(path, 'invalid configuration')
    }
  } else if (JS_EXTS.includes(ext)) {
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
  } else if (JSON_EXTS.includes(ext) || CONFIG_FILE_NAMES.includes(fileName)) {
    try {
      config = JSON.parse(di.readFile(path))
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ConfigParsingError(
          path,
          'must contain a valid c8 configuration object.',
          error
        )
      }

      throw error
    }
  } else {
    // If the user supplied a bad configuration file that we can't figure out how to read, then it's on them to solve it.
    // Attempting to use some other config, even a default one, will result in unexpected behavior: aka ignoring the config that was explicitly specified is not intuitive.
    throw new UnsupportedFileTypeError(path, [
      ...JSON_EXTS,
      ...JS_EXTS,
      ...YAML_EXTS
    ])
  }

  // TODO: validate the object schema so that we get validation of JS-like configs. Might want to refactor the above test cases so that the YAML isn't being validated twice.

  return config
}

module.exports = {
  CONFIG_FILE_NAMES,
  loadConfigFile
}
