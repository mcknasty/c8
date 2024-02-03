/* global describe, it, beforeEach, after */

const { expect } = require('chai')
const { existsSync } = require('fs')
const { join } = require('path')
const chaiJestSnapshot = require('chai-jest-snapshot')

require('chai')
  .use(chaiJestSnapshot)
  .should()

const { buildYargs } = require('../lib/parse-args')

const {
  CONFIG_FILE_NAMES,
  loadConfigFile
} = require('../lib/load-config')

const {
  UnsupportedFileTypeError,
  ConfigParsingError
} = require('../lib/error-reporting')

const {
  extLoadingTestData,
  runc8,
  setUpSnapShot,
  iterateExtTestCase,
  setUpConfigTest,
  deleteConfigTest
} = require('./load-config-helper.js')

describe(loadConfigFile.name, () => {
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

  it('c8 process should throw an error message if an invalid configuration file name is passed', function () {
    const invalidConfig = './fixtures/config/.c8.config.py'

    const expectErrorValue = 'Unsupported file type while reading file ' +
      `"${invalidConfig}". Please make sure your file of one of the ` +
      'following file types: .json, .js, .cjs, .yml, .yaml'

    expect(() => {
      loadConfigFile(invalidConfig)
    }).to.throw(
      UnsupportedFileTypeError,
      expectErrorValue
    )
  })

  it('config directory should contain all variations of the config file naming convention', () => {
    const pathPrefix = './test/fixtures/config/'
    const accountedFor = CONFIG_FILE_NAMES
      .map((configFile) => existsSync(pathPrefix + configFile))
      .reduce((prev, curr) => prev && curr)

    expect(accountedFor).to.eql(true)
  })

  describe('should be able to read config files with .json, .yml, .yaml, .js, .cjs extensions', () => {
    iterateExtTestCase(extLoadingTestData, function (descript, fileName, expectedLines) {
      describe(descript, function () {
        beforeEach(() => setUpConfigTest(fileName))

        it(`should be able to resolve config file ${fileName} with --config flag`, () => {
          const filePath = './fixtures/config/'
          const configFilePath = join(filePath, fileName)
          const args = Object.freeze(['node',
            'c8',
            'my-app',
            '--config',
            require.resolve(`./${configFilePath}`)
          ])
          const argv = buildYargs().parse(args)
          argv.lines.should.be.equal(expectedLines)
        })

        // skipping for the moment.  Need another patch for this test to successfully run
        it.skip(`should be able to resolve config file ${fileName} by detection`, function () {
          // set the snapshot filename
          const snapTestName = `should be able to resolve config file ${fileName} by detection`
          const snapFileName = './test/fixtures/config/snapshots/' + fileName + '.snap'

          setUpSnapShot(chaiJestSnapshot, snapTestName, snapFileName)

          const nodePath = process.execPath
          const env = Object.freeze({ cwd: './test/fixtures/tmp-config-test' })
          const args = Object.freeze([
            '--temp-directory=tmp/normal',
            '--all',
            '--src=./test/fixtures/tmp-config-test',
            nodePath,
            require.resolve('./fixtures/tmp-config-test/normal.js')
          ])

          // Run V8 in the dir above
          const output = runc8(args, env)
          output.toString('utf8').should.matchSnapshot()
        })

        after(deleteConfigTest)
      })
    })
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
      const configFile = 'test.json'

      const errorMessage = 'Error loading configuration from file ' +
        `"${configFile}": must contain a valid c8 configuration object. ` +
        'Original error: Unexpected end of JSON input'

      expect(() =>
        loadConfigFile(configFile, {
          ...baseDI,
          readFile: () => ''
        })
      ).to.throw(
        ConfigParsingError,
        errorMessage
      )
    })

    it('throws an error if the JSON file is invalid JSON', () => {
      const configFile = 'test.json'

      const errorPattern = 'Error loading configuration from file ".+": ' +
        'must contain a valid c8 configuration object. Original error: .*'
      const errorRegEx = new RegExp(errorPattern, 'g')

      expect(() =>
        loadConfigFile(configFile, {
          ...baseDI,
          readFile: () => 'not valid json'
        })
      ).to.throw(
        ConfigParsingError,
        errorRegEx
      )
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
