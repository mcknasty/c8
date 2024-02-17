const { spawnSync } = require('child_process')
const os = require('os')

const nodePath = process.execPath
const isWin = (os.platform() === 'win32')
const pwd = process.cwd()
const whiteSpaceReg = /[\\\s]/g

/**
 * Function: runSpawn
 *
 * @param {Array} args: array of arguments to pass
 *  to child spawned process.
 * @param {Boolean} text=false: expect json or cli
 *  text to be returned.
 * @param {Boolean} stripWhiteSpace=false: should all
 *  whitespace be removed from the `out` string?
 * @returns {String} out: a string representing the stdout
 *   of the child process
 *
 * A wrapper function around spawnSync.
 * Node.js Docs: http://tinyurl.com/66ztyx9b
 *
 * Todo:  Whitespace for snapshots is showing up in
 * different amounts on different os platforms.
 *
 * I am concern about this issue in the chai-snapshot
 * package.
 *
 * Issue described in jest
 * https://github.com/jestjs/jest/pull/9203
 *
 * Last time chai-jest-snapshot was publish was 6
 * years ago.
 *
 * https://www.npmjs.com/package/chai-jest-snapshot?activeTab=versions
 *
 * Alternative packages that might work.
 *
 * https://www.npmjs.com/package/mocha-chai-jest-snapshot
 *
 * https://www.npmjs.com/package/chai-snapshot-matcher/v/2.0.2
 *
 */
const runSpawn = (args, text = false, stripWhiteSpace = false) => {
  const pwdReg = new RegExp(pwd, 'g')

  const { output, status } = spawnSync(nodePath, args)

  let out = (!status)
    ? output[1].toString('utf8')
    : ''

  out = (isWin)
    ? windowsPathProcessing(out, text)
    : out.replace(pwdReg, '.')

  if (!text) {
    out = JSON.parse(out)
  }

  if (stripWhiteSpace) {
    out = out.replace(whiteSpaceReg, '')
  }

  return out
}

/**
 * Function: windowsPathProcessing
 *
 * @param {String} output
 * @param {Boolean} text=false
 * @returns {String} - output with windows specific absolute paths
 *   replaced with relative paths to the project's directory
 *
 * Replace all occurrences of the projects absolute path
 * with a relative directory path.
 *
 */
function windowsPathProcessing (output, text = false) {
  let jsonPwd = pwd.replace(/\\/g, '\\\\')

  // Replace once more because the json is already escaped
  if (!text) {
    jsonPwd = jsonPwd.replace(/\\/g, '\\\\')
  }

  // match the escaped absolute project's directory
  const jsonPwdReg = new RegExp(jsonPwd, 'g')
  // replace with a relative path
  return output.replace(jsonPwdReg, '.')
}

/**
 * Function: textGetConfigKey
 *
 * @param {String} out: utf-8 formatted output from
 *  child process of c8 with --print-config flag.
 * @param {String} key: of configuration setting
 *  to return.
 * @returns {String|null}: value of key, if
 *  found or null.
 *
 * Get a value of a configuration key from text input.
 *
 */
const textGetConfigKey = (out, key) => {
  const newLineReturn = (isWin) ? '\r\n' : '\n'
  const newLineRegEx = new RegExp(newLineReturn, 'g')

  let value = null
  const keyReg = new RegExp(key + ':.+', 'g')
  const matches = [...out.matchAll(keyReg)]
  if (matches.length > 0 && typeof matches[0][0] === 'string') {
    const fileName = matches[0][0].replace(newLineRegEx, '')
      .replace(key + ':', '')
      .replace(whiteSpaceReg, '')
      .replace(/'/g, '')
    value = fileName
  }

  return value
}

module.exports = { runSpawn, textGetConfigKey }
