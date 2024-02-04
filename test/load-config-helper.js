const { spawnSync } = require('child_process')
const { mkdirSync, copyFileSync, rmSync, existsSync } = require('fs')
const { join } = require('path')

const testPath = './test/fixtures/tmp-config-test'

const iterateExtTestCase = function (testDataObj, callback) {
  Object.keys(testDataObj).forEach((key) => {
    Object.keys(testDataObj[key]).forEach((fileName) => {
      const expectedLines = testDataObj[key][fileName]
      callback(fileName, expectedLines)
    })
  })
}

const setUpConfigTest = (configFileName) => {
  deleteConfigTest()
  // make the directory tmp-config-test
  mkdirSync(testPath)

  // Copy config file in fileName and test/fixtures/normal.js to dir above
  copyFileSync('./test/fixtures/normal.js', join(testPath, '/normal.js'))
  copyFileSync('./test/fixtures/async.js', join(testPath, '/async.js'))
  copyFileSync('./test/fixtures/config/' + configFileName, join(testPath, configFileName))
}

const deleteConfigTest = () => {
  if (existsSync(testPath)) {
    rmSync(testPath, { recursive: true, force: true })
  }
}

const runc8 = (c8args, env = {}) => {
  const c8Path = require.resolve('../bin/c8')
  const nodePath = process.execPath
  const c8argsv = [c8Path, ...c8args]

  const { output } = spawnSync(nodePath, c8argsv, env)

  return output
}

const setUpSnapShot = (snapShotObj, testName, fileName) => {
  snapShotObj.setTestName(testName)
  snapShotObj.setFilename(fileName)
}

const extLoadingTestData = Object.freeze({
  c8: {
    '.c8rc.json': 101,
    '.c8rc.yml': 69,
    '.c8rc.yaml': 10,
    'c8.config.js': 47,
    'c8.config.cjs': 51,
    '.c8rc.js': 22,
    '.c8rc.cjs': 32,
    '.c8.config.js': 47,
    '.c8.config.cjs': 45
  },
  nyc: {
    '.nycrc': 51,
    '.nycrc.json': 96,
    '.nycrc.yml': 99,
    '.nycrc.yaml': 98,
    'nyc.config.js': 95,
    'nyc.config.cjs': 94,
    '.nyc.config.js': 85,
    '.nyc.config.cjs': 71
  }
})

module.exports = {
  extLoadingTestData,
  runc8,
  setUpSnapShot,
  iterateExtTestCase,
  setUpConfigTest,
  deleteConfigTest
}
