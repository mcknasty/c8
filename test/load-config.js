/* global describe, it, beforeEach, after */

const { assert, expect } = require('chai')
const { existsSync } = require('fs')
const { join } = require('path')
const { buildYargs } = require('../lib/parse-args')
const chaiJestSnapshot = require('chai-jest-snapshot')
const { spawnSync } = require('child_process')

require('chai').should()

const {
  CONFIG_FILE_NAMES,
  loadConfigFile
} = require('../lib/load-config')

const {
  testConfigFile,
  beforeTestReadingConfigFile,
  afterTestReadingConfigFile
} = require('./load-config-helper.js')

const c8Path = require.resolve('../bin/c8')
const nodePath = process.execPath

describe(__filename, () => {
  describe(loadConfigFile.name, () => {
    it('config directory should contain all variations of the config file naming convention', () => {
      let count = 0
      const fileMessages = []
      CONFIG_FILE_NAMES.forEach((file) => {
        const fullPath = './test/fixtures/config/' + file
        if (existsSync(fullPath)) {
          count++
        } else {
          fileMessages.push(
            `Missing ${file} from ./test/fixtures/config directory`
          )
        }
      })

      if (count === CONFIG_FILE_NAMES.length) {
        assert.equal(count, CONFIG_FILE_NAMES.length)
      } else {
        const msg = fileMessages.join(' \n      ')
        assert.equal(fileMessages.length, 0, msg)
      }
    })

    describe('should be able to read config files with .json, .yml, .yaml, .js, .cjs extensions', () => {
      const filePath = './fixtures/config/'
      const testData = {
        c8: {
          description: 'c8 variations of config file',
          fileNameLineNumberMap: {
            '.c8rc.json': 101,
            '.c8rc.yml': 69,
            '.c8rc.yaml': 10,
            'c8.config.js': 47,
            'c8.config.cjs': 51,
            '.c8rc.js': 22,
            '.c8rc.cjs': 32,
            '.c8.config.js': 47,
            '.c8.config.cjs': 45
          }
        },
        nyc: {
          description: 'nyc variations of config file',
          fileNameLineNumberMap: {
            '.nycrc': 51,
            '.nycrc.json': 96,
            '.nycrc.yml': 99,
            '.nycrc.yaml': 98,
            'nyc.config.js': 95,
            'nyc.config.cjs': 94,
            '.nyc.config.js': 85,
            '.nyc.config.cjs': 71
          }
        }
      }

      Object.keys(testData).forEach(key => {
        const { description, fileNameLineNumberMap } = testData[key]
        describe(description, function () {
          testConfigFile(filePath, fileNameLineNumberMap, function (fileName, expectedLines) {
            beforeEach(() => beforeTestReadingConfigFile(fileName))
            it(`should be able to resolve config file ${fileName} with --config flag`, () => {
              const configFilePath = join(filePath, fileName)
              const argv = buildYargs().parse(['node', 'c8', 'my-app', '--config', require.resolve(`./${configFilePath}`)])
              argv.lines.should.be.equal(expectedLines)
            })

            // skipping for the moment.  Need another patch for this test to successfully run
            it.skip(`should be able to resolve config file ${fileName} by detection`, function () {
              // set the snapshot filename
              chaiJestSnapshot.setTestName(`should be able to resolve config file ${fileName} by detection`)
              chaiJestSnapshot.setFilename('./test/fixtures/config/snapshots/' + fileName + '.snap')

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
            after(afterTestReadingConfigFile)
          })
        })
      })
    })

    it('throws an error message if an invalid configuration file name is passed', function () {
      const invalidConfig = './fixtures/config/.c8.config.py'

      expect(() => loadConfigFile(invalidConfig)).to.throw(
        Error,
        `Unsupported file type .py while reading file ${invalidConfig}`
      )
    })
  })
})
