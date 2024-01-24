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

module.exports = {
  CONFIG_FILE_NAMES,
  loadConfigFile
}
