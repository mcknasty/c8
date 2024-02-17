const { spawnSync } = require('child_process')
const os = require('os')

const nodePath = process.execPath
const isWin = (os.platform() === 'win32')
const pwd = process.cwd()
const whiteSpaceReg = /[\\\s]/g
const pwdReg = new RegExp(pwd, 'g')

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
 *
 * Todo: Refactor line 64 - 72.  Need to look into this replacement.
 * this seems to work, but I am unsure on why the JSON.stringify and
 * the immediate replace function are necessary.  Is there some sort
 * of non-visible character?
 *
 */
const runSpawn = (args, text = false, stripWhiteSpace = false) => {
  const slashReg = /\\/g

  const { output, status } = spawnSync(nodePath, args)

  let out = ''
  if (!status) {
    out = output[1].toString('utf8')
  }

  if (!text) {
    if (isWin) {
      // Replace all occurrences of the current working directory
      // with a relative directory.  See Todo note.
      const jsonPwd = JSON.stringify(pwd)
        .replace(/"/g, '')
        .replace(slashReg, '\\\\')
      const jsonPwdReg = new RegExp(jsonPwd, 'g')
      out = out.replace(jsonPwdReg, '.')
    } else {
      out = out.replace(pwdReg, '.')
    }
    out = JSON.parse(out)
  } else if (text) {
    out = out.replace(pwdReg, '.')
    if (stripWhiteSpace) {
      out = out.replace(whiteSpaceReg, '')
    }
  }

  return out
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
