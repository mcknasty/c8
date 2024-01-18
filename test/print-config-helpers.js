const { spawnSync } = require('child_process')
const nodePath = process.execPath

const runSpawn = (args) => {
  const { output } = spawnSync(nodePath, args)
  return output.toString('utf8')
}

// JSON needs to get scrubbed from additional characters
// when being read from SpawnSync
const cleanJson = (out) => {
  const o = out.replaceAll(',{', '{').replaceAll('\n,', '')
  return JSON.parse(o)
}

const textGetConfigKey = (out, key) => {
  let value = null
  const reg = new RegExp('\n' + key + ':.+\n')
  const matches = out.match(reg)
  if (matches && typeof matches[0] === 'string') {
    const fileName = matches[0].replaceAll('\n', '')
      .replaceAll(key + ':', '')
      .replaceAll(' ', '')
      .replaceAll("'", '')
    value = fileName
  }

  return value
}

module.exports = { runSpawn, cleanJson, textGetConfigKey }
