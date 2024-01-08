/* global it */

const { buildYargs } = require('../lib/parse-args')
const { spawnSync } = require('child_process')
const { mkdir, copyFile, rm, access, constants } = require('fs')
const chaiJestSnapshot = require('chai-jest-snapshot')

const c8Path = require.resolve('../bin/c8')
const nodePath = process.execPath

const testPath = './test/fixtures/tmp-config-test'
const testReadingConfigFile = (fileNameLineNumberMap, filePath) => {
  Object.keys(fileNameLineNumberMap).forEach((fileName) => {
    it(`should be able to resolve config file ${fileName} with --config flag`, (done) => {
      beforeTestReadingConfigFile(() => {
        const expectedLines = fileNameLineNumberMap[fileName]
        const argv = buildYargs().parse(['node', 'c8', 'my-app', '--config', require.resolve(`${filePath}${fileName}`)])
        argv.lines.should.be.equal(expectedLines)
        afterTestReadingConfigFile(done)
      })
    })

    it(`should be able to resolve config file ${fileName} by detection`, (done) => {
      beforeTestReadingConfigFile(() => {
        // set the snapshot filename
        chaiJestSnapshot.setFilename('./test/fixtures/config/snapshots/' + fileName + '.snap')

        // copyFileSync('./test/fixtures/config/' + fileName, testPath + '/' + fileName)
        copyFile('./test/fixtures/config/' + fileName, testPath + '/' + fileName, () => {
          // Run V8 in the dir above
          const { output } = spawnSync(nodePath, [
            c8Path,
            nodePath,
            require.resolve('./fixtures/tmp-config-test/normal.js')
          ])
          output.toString('utf8').should.matchSnapshot()
          afterTestReadingConfigFile(done)
        })
      })
    })
  })
}

const beforeTestReadingConfigFile = (callback) => {
  mkdir(testPath, () => {
    copyFile('./test/fixtures/normal.js', testPath + '/normal.js', () => {
      copyFile('./test/fixtures/async.js', testPath + '/async.js', () => {
        callback()
      })
    })
  })
}

const afterTestReadingConfigFile = (done) => {
  access(testPath, constants.F_OK, () => {
    rm(testPath, { recursive: true, force: true }, () => {
      done()
    })
  })
}

module.exports = {
  testReadingConfigFile: testReadingConfigFile,
  beforeTestReadingConfigFile: beforeTestReadingConfigFile,
  afterTestReadingConfigFile: afterTestReadingConfigFile
}
