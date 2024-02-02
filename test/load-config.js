/* global describe, it, beforeEach, after */

const { assert, expect } = require('chai')
const { existsSync } = require('fs')
const { join } = require('path')
const { buildYargs } = require('../lib/parse-args')
const chaiJestSnapshot = require('chai-jest-snapshot')
const { spawnSync } = require('child_process')

const {
  UnsupportedFileTypeError,
  ConfigParsingError
} = require('../lib/error-reporting')
const { CONFIG_FILE_NAMES, loadConfigFile } = require('../lib/load-config')

const {
  testConfigFile,
  beforeTestReadingConfigFile,
  afterTestReadingConfigFile
} = require('./load-config-helper.js')

const c8Path = require.resolve('../bin/c8')
const nodePath = process.execPath

describe(__filename, () => {
  const baseDI = {
    // These specify default functions for all the DI calls.
    // Each should throw an error if called so that the tests have to override the ones that are expected.
    // Any test that actually fails with one of these errors was either not set up correctly or the code that's being tested isn't writen correctly.
    readFile () {
      throw new Error('Test not set up to handle calls to readFile!')
    },
    readJs () {
      throw new Error('Test not set up to handle calls to readJs!')
    }
  }

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

      Object.keys(testData).forEach((key) => {
        const { description, fileNameLineNumberMap } = testData[key]
        describe(description, function () {
          testConfigFile(
            filePath,
            fileNameLineNumberMap,
            function (fileName, expectedLines) {
              beforeEach(() => beforeTestReadingConfigFile(fileName))
              it(`should be able to resolve config file ${fileName} with --config flag`, () => {
                const configFilePath = join(filePath, fileName)
                const argv = buildYargs().parse([
                  'node',
                  'c8',
                  'my-app',
                  '--config',
                  require.resolve(`./${configFilePath}`)
                ])
                argv.lines.should.be.equal(expectedLines)
              })

              // skipping for the moment.  Need another patch for this test to successfully run
              it.skip(`should be able to resolve config file ${fileName} by detection`, function () {
                // set the snapshot filename
                chaiJestSnapshot.setTestName(
                  `should be able to resolve config file ${fileName} by detection`
                )
                chaiJestSnapshot.setFilename(
                  './test/fixtures/config/snapshots/' + fileName + '.snap'
                )

                // Run V8 in the dir above
                const { output } = spawnSync(
                  nodePath,
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
            }
          )
        })
      })
    })

    it('throws an error message if an invalid configuration file name is passed', function () {
      const invalidConfig = './fixtures/config/.c8.config.py'

      expect(() => loadConfigFile(invalidConfig, baseDI)).to.throw(
        UnsupportedFileTypeError
      )
    })

    describe('handles file extensions in a case insensitive manner', () => {
      for (const ext of ['.jSoN', '.JSON']) {
        it(`reads a JSON file with extension ${ext}`, () => {
          expect(
            loadConfigFile(`test${ext}`, {
              ...baseDI,
              readFile: () => '{"statements":12}'
            })
          ).to.deep.equal({ statements: 12 })
        })
      }

      for (const ext of ['.CJS', '.CJs', '.jS', '.JS']) {
        it(`reads a Common JS file with extension ${ext}`, () => {
          expect(
            loadConfigFile(`test${ext}`, {
              ...baseDI,
              readJs: () => ({
                statements: 12
              })
            })
          ).to.deep.equal({ statements: 12 })
        })
      }

      for (const ext of ['.Yml', '.YAML']) {
        it(`reads a YAML file with extension ${ext}`, () => {
          expect(
            loadConfigFile(`test${ext}`, {
              ...baseDI,
              readFile: () => 'statements: 12'
            })
          ).to.deep.equal({ statements: 12 })
        })
      }
    })

    describe('.json', () => {
      it('throws an error if the JSON file is empty', () => {
        expect(() =>
          loadConfigFile('test.json', {
            ...baseDI,
            readFile: () => ''
          })
        ).to.throw(ConfigParsingError, /Unexpected end of JSON input/)
      })

      it('throws an error if the JSON file is invalid JSON', () => {
        expect(() =>
          loadConfigFile('test.json', {
            ...baseDI,
            readFile: () => 'not valid json'
          })
        ).to.throw(ConfigParsingError, /Unexpected token /)
      })

      it('returns an empty config if the JSON file has an empty object', () => {
        expect(
          loadConfigFile('test.json', {
            ...baseDI,
            readFile: () => '{}'
          })
        ).to.deep.equal({})
      })

      it('throws the expected error if the file reader throws', () => {
        const expectedError = new Error('the expected error')

        expect(() =>
          loadConfigFile('test.json', {
            ...baseDI,
            readFile: () => {
              throw expectedError
            }
          })
        ).to.throw(Error, expectedError.message)
      })
    })

    describe('.cjs', () => {
      it('throws an error if the CJS file is empty', () => {
        const { readJs: _readJs, ...di } = baseDI
        // Note: allowing require to access the file will only work on one test in the entire test suite due to NodeJS global module caching.
        expect(() =>
          loadConfigFile('../test/fixtures/config/blank.cjs', di)
        ).to.throw(
          ConfigParsingError,
          /does not export a c8 configuration object/
        )
      })

      it('throws the error given by require if the CJS file is invalid Common JS', () => {
        expect(() =>
          loadConfigFile('test.cjs', {
            ...baseDI,
            readJs: () => {
              throw new Error('invalid CJS test')
            }
          })
        ).to.throw(Error, 'invalid CJS test')
      })

      it('returns an empty config if the CJS file exports an empty object', () => {
        expect(
          loadConfigFile('test.cjs', {
            ...baseDI,
            readJs: () => ({}) // require('./test.cjs') returns {} when the file contains module.exports = {}
          })
        ).to.deep.equal({})
      })
    })

    describe('.js', () => {
      it('returns an empty config if the JS file is empty', () => {
        const { readJs: _readJs, ...di } = baseDI
        // Note: allowing require to access the file will only work on one test in the entire test suite due to NodeJS global module caching.
        expect(() =>
          loadConfigFile('../test/fixtures/config/blank.js', di)
        ).to.throw(
          ConfigParsingError,
          /does not export a c8 configuration object/
        )
      })

      it('throws the error given by require if the JS file is invalid Common JS', () => {
        expect(() =>
          loadConfigFile('test.js', {
            ...baseDI,
            readJs: () => {
              throw new Error('invalid JS test')
            }
          })
        ).to.throw(Error, 'invalid JS test')
      })

      it('returns an empty config if the JS file exports an empty object', () => {
        expect(
          loadConfigFile('test.js', {
            ...baseDI,
            readJs: () => ({}) // require('./test.js') returns {} when the file contains module.exports = {}
          })
        ).to.deep.equal({})
      })
    })

    for (const ext of ['.yaml', '.yml']) {
      describe(ext, () => {
        it('throws an error if the YAML file is empty', () => {
          expect(() =>
            loadConfigFile(`test${ext}`, {
              ...baseDI,
              readFile: () => ''
            })
          ).to.throw(ConfigParsingError, /invalid configuration/i)
        })

        it('throws an error if the YAML file is invalid', () => {
          expect(() =>
            loadConfigFile(`test${ext}`, {
              ...baseDI,
              readFile: () => '%not valid'
            })
          ).to.throw(
            ConfigParsingError,
            /must contain a valid c8 configuration object/i
          )
        })

        it('throws the expected error if the file reader throws', () => {
          const expectedError = new Error('the expected error')

          expect(() =>
            loadConfigFile(`test${ext}`, {
              ...baseDI,
              readFile: () => {
                throw expectedError
              }
            })
          ).to.throw(Error, expectedError.message)
        })
      })
    }
  })
})
