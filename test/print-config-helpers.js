const { spawnSync } = require('child_process')
const os = require('os')

const nodePath = process.execPath
const isWin = (os.platform() === 'win32')
const pwd = process.cwd()
const whiteSpaceReg = /[\\\s]/g
const pwdReg = new RegExp(pwd, 'g')
const newLineReturn = (isWin) ? '\r\n' : '\n'
const newLineRegEx = new RegExp(newLineReturn, 'g')
const doubleQuoteReg = /"/g
const slashReg = /\\/g

const runSpawn = (args, text = false, stripWhiteSpace = false) => {
  const { output } = spawnSync(nodePath, args)

  let out = output.toString('utf8')

  if (isWin && text) {
    const jsonEncodedPwd = JSON.stringify(pwd)
      .replace(doubleQuoteReg, '')
    const encodedPwdRegEx = new RegExp(jsonEncodedPwd, 'g')
    out = out.replace(encodedPwdRegEx, '.')
  } else if (isWin && !text) {
    const jsonEncodedPwd = JSON.stringify(pwd)
      .replace(doubleQuoteReg, '')
      .replace(slashReg, '\\\\')
    const encodedPwdRegEx = new RegExp(jsonEncodedPwd, 'g')
    out = out.replace(encodedPwdRegEx, '.')
  } else if (!isWin) {
    out = out.replace(pwdReg, '.')
  }

  if (text && stripWhiteSpace) { out = out.replace(whiteSpaceReg, '') }

  if (!text) { out = cleanJson(out) }

  return out
}

// JSON needs to get scrubbed from additional characters
// when being read from SpawnSync
const cleanJson = (out) => {
  const o = out.substring(1)
    .substring(0, out.length - 2)
    .replace(pwdReg, '.')

  return JSON.parse(o)
}

const textGetConfigKey = (out, key) => {
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

module.exports = { runSpawn, cleanJson, textGetConfigKey }
