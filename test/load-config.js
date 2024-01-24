const { assert, expect } = require('chai')
const { existsSync } = require('fs')

const { CONFIG_FILE_NAMES, loadConfigFile } = require('../lib/load-config')

const {
  testReadingConfigFile,
  beforeTestReadingConfigFile,
  afterTestReadingConfigFile
} = require('./load-config-helper.js')

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

    const filePath = './fixtures/config/'
    describe('c8 variations of config file', () => {
      describe('should be able to read config files with .json, .yml, .yaml, .js, .cjs extensions', () => {
        beforeEach(beforeTestReadingConfigFile)

        const fileNameLineNumberMap = {
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

        testReadingConfigFile(fileNameLineNumberMap, filePath)

        afterEach(afterTestReadingConfigFile)
      })
    })

    describe('nyc variations of config file', () => {
      describe('should be able to read config files with .json, .yml, .yaml, .js, .cjs extensions', () => {
        beforeEach(beforeTestReadingConfigFile)

        const fileNameLineNumberMap = {
          '.nycrc': 51,
          '.nycrc.json': 96,
          '.nycrc.yml': 99,
          '.nycrc.yaml': 98,
          'nyc.config.js': 95,
          'nyc.config.cjs': 94,
          '.nyc.config.js': 85,
          '.nyc.config.cjs': 71
        }

        testReadingConfigFile(fileNameLineNumberMap, filePath)

        afterEach(afterTestReadingConfigFile)
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
