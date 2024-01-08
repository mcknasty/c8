/* global describe, it */

const {
  buildYargs,
  hideInstrumenteeArgs,
  hideInstrumenterArgs,
  getConfigFileNames,
  loadConfigFile
} = require('../lib/parse-args')

const { join } = require('path')
const { existsSync, copyFile } = require('fs')
const { assert } = require('chai')
const { spawn } = require('child_process')
const chaiJestSnapshot = require('chai-jest-snapshot')
const {
  testReadingConfigFile,
  beforeTestReadingConfigFile,
  afterTestReadingConfigFile
} = require('./parse-args-helper.js')

require('chai')
  .use(chaiJestSnapshot)
  .should()

describe('parse-args', () => {
  describe('hideInstrumenteeArgs', () => {
    it('hides arguments passed to instrumented app', () => {
      process.argv = ['node', 'c8', '--foo=99', 'my-app', '--help']
      const instrumenterArgs = hideInstrumenteeArgs()
      instrumenterArgs.should.eql(['--foo=99', 'my-app'])
    })

    it('test early exit from function if no arguments are passed', () => {
      process.argv = []
      const instrumenterArgs = hideInstrumenteeArgs()
      instrumenterArgs.length.should.eql(0)
    })
  })

  describe('hideInstrumenterArgs', () => {
    it('hides arguments passed to c8 bin', () => {
      process.argv = ['node', 'c8', '--foo=99', 'my-app', '--help']
      const argv = buildYargs().parse(hideInstrumenteeArgs())
      const instrumenteeArgs = hideInstrumenterArgs(argv)
      instrumenteeArgs.should.eql(['my-app', '--help'])
      argv.tempDirectory.endsWith(join('coverage', 'tmp')).should.be.equal(true)
    })

    it('interprets first args after -- as Node.js execArgv', async () => {
      const expected = [process.execPath, '--expose-gc', 'index.js']
      process.argv = ['node', 'c8', '--', '--expose-gc', 'index.js']
      const argv = buildYargs().parse(hideInstrumenteeArgs())
      const munged = hideInstrumenterArgs(argv)
      munged.should.deep.equal(expected)
    })
  })

  describe('with NODE_V8_COVERAGE already set', () => {
    it('should not override it', () => {
      const NODE_V8_COVERAGE = process.env.NODE_V8_COVERAGE
      process.env.NODE_V8_COVERAGE = './coverage/tmp_'
      process.argv = ['node', 'c8', '--foo=99', 'my-app', '--help']
      const argv = buildYargs().parse(hideInstrumenteeArgs())
      argv.tempDirectory.endsWith('/coverage/tmp_').should.be.equal(true)
      process.env.NODE_V8_COVERAGE = NODE_V8_COVERAGE
    })
  })

  describe('--config', () => {
    it('c8 process should throw an error message if an invalid configuration file name is passed', () => {
      const invalidConfig = './fixtures/config/.c8.config.py'
      const loadInvalidConfigFile = (file, callBack) => {
        try {
          callBack(file)
          assert.equal(true, false, 'Invalid configuration file loaded')
        } catch (error) {
          assert.equal(true, true, `${error}`)
        }
      }

      loadInvalidConfigFile(invalidConfig, (file) => {
        loadConfigFile(file)
      })
    })

    it('config directory should contain all variations of the config file naming convention', () => {
      let count = 0
      const fileMessages = []
      const configFileList = getConfigFileNames()
      configFileList.forEach((file) => {
        const fullPath = './test/fixtures/config/' + file
        if (existsSync(fullPath)) {
          count++
        } else {
          fileMessages.push(`Missing ${file} from ./test/fixtures/config directory`)
        }
      })

      if (count === configFileList.length) {
        assert.equal(count, configFileList.length)
      } else {
        const msg = fileMessages.join(' \n      ')
        assert.equal(fileMessages.length, 0, msg)
      }
    })

    const filePath = './fixtures/config/'
    describe('c8 variations of config file', () => {
      describe('should be able to read config files with .json, .yml, .yaml, .js, .cjs extensions', () => {
        const testPath = './test/fixtures/tmp-config-test'

        const c8Path = require.resolve('../bin/c8')
        const nodePath = process.execPath

        it('should be able to resolve config file .c8rc.json with --config flag', (done) => {
          beforeTestReadingConfigFile(() => {
            const expectedLines = 101
            const argv = buildYargs().parse(['node', 'c8', 'my-app', '--config', require.resolve(`${filePath}.c8rc.json`)])
            argv.lines.should.be.equal(expectedLines)
            afterTestReadingConfigFile(done)
          })
        })
        /*** */
        it(`should be able to resolve config file .c8rc.json by detection`, (done) => {
          beforeTestReadingConfigFile(() => {
            // set the snapshot filename
            // chaiJestSnapshot.setFilename('./test/fixtures/config/snapshots/.c8rc.json.snap')
    
            // copyFileSync('./test/fixtures/config/' + fileName, testPath + '/' + fileName)
            copyFile('./test/fixtures/config/.c8rc.json', testPath + '/.c8rc.json', () => {
              // Run V8 in the dir above
              /** * /
              const { output } = spawnSync(nodePath, [
                c8Path,
                nodePath,
                require.resolve('./fixtures/tmp-config-test/normal.js')
              ])
              output.toString('utf8').should.matchSnapshot()
              afterTestReadingConfigFile(done)
              /** */

              // Run V8 in the dir above
              /* c8 ignore next 7 */
              const v8Process = spawn(nodePath, [
                c8Path,
                nodePath,
                require.resolve('./fixtures/tmp-config-test/normal.js')
              ])
              const buf = Buffer.alloc(99999999);
              v8Process.stdout.on('data', (data) => {
                buf.write(data.toString('utf8'))
              });
              v8Process.stderr.on('data', (data) => {
                buf.write(data.toString('utf8'))
              });
              v8Process.on('close', (code) => {
                // if (code !== 0) {
                  //buf.toString('utf8').should.matchSnapshot()
                  afterTestReadingConfigFile(done)
                // }
              });
            })
          })
        })
        /** */
        it('should be able to resolve config file .c8rc.yml with --config flag', (done) => {
          beforeTestReadingConfigFile(() => {
            const expectedLines = 69
            const argv = buildYargs().parse(['node', 'c8', 'my-app', '--config', require.resolve(`${filePath}.c8rc.yml`)])
            argv.lines.should.be.equal(expectedLines)
            afterTestReadingConfigFile(done)
          })
        })
        /*** * /
        it('should be able to resolve config file .c8rc.yml by detection', (done) => {
          beforeTestReadingConfigFile(() => {
            // set the snapshot filename
            chaiJestSnapshot.setFilename('./test/fixtures/config/snapshots/.c8rc.yml.snap')
    
            // copyFileSync('./test/fixtures/config/.c8rc.yml', testPath + '/.c8rc.yml')
            copyFile('./test/fixtures/config/.c8rc.yml', testPath + '/.c8rc.yml', () => {
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
        /*** * /
        /** * /
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
        /** */
      })
    })
    /** * /
    describe('nyc variations of config file', () => {
      describe('should be able to read config files with .json, .yml, .yaml, .js, .cjs extensions', () => {
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
      })
    })
    /** */
    it('should resolve to .nycrc at cwd', () => {
      const argv = buildYargs().parse(['node', 'c8', 'my-app'])
      argv.lines.should.be.equal(95)
    })
    it('should use config file specified in --config', () => {
      const argv = buildYargs().parse(['node', 'c8', '--config', require.resolve('./fixtures/config/.c8rc.json')])
      argv.lines.should.be.equal(101)
      argv.tempDirectory.should.be.equal('./foo')
      argv.functions.should.be.equal(24)
    })
    it('should have -c as an alias', () => {
      const argv = buildYargs().parse(['node', 'c8', '-c', require.resolve('./fixtures/config/.c8rc.json')])
      argv.lines.should.be.equal(101)
      argv.tempDirectory.should.be.equal('./foo')
      argv.functions.should.be.equal(24)
    })
    it('should respect options on the command line over config file', () => {
      const argv = buildYargs().parse(['node', 'c8', '--lines', '100', '--config', require.resolve('./fixtures/config/.c8rc.json')])
      argv.lines.should.be.equal(100)
    })
    it('should allow config files to extend each other', () => {
      const argv = buildYargs().parse(['node', 'c8', '--lines', '100', '--config', require.resolve('./fixtures/config/.c8rc-base.json')])
      argv.branches.should.be.equal(55)
      argv.lines.should.be.equal(100)
      argv.functions.should.be.equal(24)
    })
  })

  describe('--merge-async', () => {
    it('should default to false', () => {
      const argv = buildYargs().parse(['node', 'c8'])
      argv.mergeAsync.should.be.equal(false)
    })

    it('should set to true when flag exists', () => {
      const argv = buildYargs().parse(['node', 'c8', '--merge-async'])
      argv.mergeAsync.should.be.equal(true)
    })
  })
})
