/* global it */

const { buildYargs } = require('../lib/parse-args')
const { spawnSync } = require('child_process')
const { mkdirSync, copyFileSync, rmSync, existsSync } = require('fs')
const chaiJestSnapshot = require('chai-jest-snapshot')

const c8Path = require.resolve('../bin/c8')
const nodePath = process.execPath

const testPath = './test/fixtures/tmp-config-test'
function testReadingConfigFile (fileNameLineNumberMap, filePath) {
  Object.keys(fileNameLineNumberMap).forEach((fileName) => {
    it(`should be able to resolve config file ${fileName} with --config flag`, () => {
      const expectedLines = fileNameLineNumberMap[fileName]
      const argv = buildYargs().parse(['node', 'c8', 'my-app', '--config', require.resolve(`${filePath}${fileName}`)])
      argv.lines.should.be.equal(expectedLines)
    })

    it(`should be able to resolve config file ${fileName} by detection`, function () {
      this.skip()
      // set the snapshot filename
      chaiJestSnapshot.setTestName(`should be able to resolve config file ${fileName} by detection`)
      chaiJestSnapshot.setFilename('./test/fixtures/config/snapshots/' + fileName + '.snap')

      copyFileSync('./test/fixtures/config/' + fileName, testPath + '/' + fileName)
      // Run V8 in the dir above
      const { output } = spawnSync(nodePath,
        [
          c8Path,
          '--temp-directory=tmp/normal',
          '--all',
          '--src=./test/fixtures/tmp-config-test',
          nodePath,
          require.resolve('./fixtures/tmp-config-test/normal.js')
        ],
        { cwd: './test/fixtures/tmp-config-test' }
      )
      output.toString('utf8').should.matchSnapshot()
    })
  })
}

const beforeTestReadingConfigFile = () => {
  // make the directory tmp-config-test
  mkdirSync(testPath)

  // Copy config file in fileName and test/fixtures/normal.js to dir above
  copyFileSync('./test/fixtures/normal.js', testPath + '/normal.js')
  copyFileSync('./test/fixtures/async.js', testPath + '/async.js')
}

const afterTestReadingConfigFile = () => {
  if (existsSync(testPath)) {
    rmSync(testPath, { recursive: true, force: true })
  }
}

module.exports = {
  testReadingConfigFile: testReadingConfigFile,
  beforeTestReadingConfigFile: beforeTestReadingConfigFile,
  afterTestReadingConfigFile: afterTestReadingConfigFile
}
