/* global describe, it */

const {
  buildYargs,
  hideInstrumenteeArgs,
  hideInstrumenterArgs
} = require('../lib/parse-args')

const { resolve } = require('path')
const { expect } = require('chai')

describe('parse-args', async () => {
  describe('hideInstrumenteeArgs', async () => {
    it('hides arguments passed to instrumented app', async () => {
      process.argv = ['node', 'c8', '--foo=99', 'my-app', '--help']
      const instrumenterArgs = hideInstrumenteeArgs()
      expect(instrumenterArgs).to.have.members(['--foo=99', 'my-app'])
    })

    it('test early exit from function if no arguments are passed', () => {
      process.argv = []
      const instrumenterArgs = hideInstrumenteeArgs()
      expect(instrumenterArgs.length).to.equal(0)
    })
  })

  describe('hideInstrumenterArgs', async () => {
    it('hides arguments passed to c8 bin', async () => {
      process.argv = ['node', 'c8', '--foo=99', 'my-app', '--help']
      const argv = await buildYargs(hideInstrumenteeArgs())
      const instrumenteeArgs = hideInstrumenterArgs(argv)
      const currentDir = process.cwd()
      const expectedTmpDir = resolve(currentDir + '/coverage/tmp')
      expect(instrumenteeArgs).to.have.members(['my-app', '--help'])
      expect(argv.tempDirectory).to.equal(expectedTmpDir)
    })

    it('interprets first args after -- as Node.js execArgv', async () => {
      const expected = [process.execPath, '--expose-gc', 'index.js']
      process.argv = ['node', 'c8', '--', '--expose-gc', 'index.js']
      const argv = await buildYargs(hideInstrumenteeArgs())
      const munged = hideInstrumenterArgs(argv)
      munged.should.deep.equal(expected)
    })
  })

  describe('with NODE_V8_COVERAGE already set', async () => {
    it('should not override it', async () => {
      const NODE_V8_COVERAGE = process.env.NODE_V8_COVERAGE
      process.env.NODE_V8_COVERAGE = './coverage/tmp_'
      process.argv = ['node', 'c8', '--foo=99', 'my-app', '--help']
      const argv = await buildYargs(hideInstrumenteeArgs())
      expect(argv.tempDirectory).to.equal('./coverage/tmp_')
      process.env.NODE_V8_COVERAGE = NODE_V8_COVERAGE
    })
  })

  describe('--config', () => {
    it('should resolve to .nycrc at cwd', async () => {
      const argv = await buildYargs(['node', 'c8', 'my-app'])
      expect(argv.lines).to.equal(95)
    })

    it('should resolve be able to resolve config files with .js extensions', async () => {
      const argv = await buildYargs(['node', 'c8', 'my-app', '--config', require.resolve('./fixtures/config/.nycrc.js')])
      expect(argv.lines).to.equal(95)
    })

    it('should resolve be able to resolve config files with .yml extensions', async () => {
      const argv = await buildYargs(['node', 'c8', 'my-app', '--config', require.resolve('./fixtures/config/.nycrc.yml')])
      expect(argv.lines).to.equal(99)
    })

    it('should resolve be able to resolve config files with .yaml extensions', async () => {
      const argv = await buildYargs(['node', 'c8', 'my-app', '--config', require.resolve('./fixtures/config/.nycrc.yaml')])
      expect(argv.lines).to.equal(98)
    })

    it('should resolve be able to resolve config files with .cjs extensions', async () => {
      const argv = await buildYargs(['node', 'c8', 'my-app', '--config', require.resolve('./fixtures/config/.nycrc.cjs')])
      expect(argv.lines).to.equal(94)
    })

    it('should resolve be able to resolve config files with .json extensions', async () => {
      const argv = await buildYargs(['node', 'c8', 'my-app', '--config', require.resolve('./fixtures/config/.nycrc.json')])
      expect(argv.lines).to.equal(96)
    })

    it('should resolve be able to resolve config files with .mjs extensions', async () => {
      const argv = await buildYargs(['node', 'c8', 'my-app', '--config', require.resolve('./fixtures/config/.c8rc.mjs')])
      expect(argv.lines).to.equal(95)
      expect(argv.reporter).to.have.members([ "html", "text"])
    })

    it('should use config file specified in --config', async () => {
      const argv = await buildYargs(['node', 'c8', 'my-app', '--config', require.resolve('./fixtures/config/.c8rc.json')])
      expect(argv.lines).to.equal(101)
      expect(argv.tempDirectory).to.equal('./foo')
    })

    it('should have -c as an alias', async () => {
      const argv = await buildYargs(['node', 'c8', '-c', require.resolve('./fixtures/config/.c8rc.json')])
      expect(argv.lines).to.equal(101)
      expect(argv.tempDirectory).to.equal('./foo')
    })

    it('should respect options on the command line over config file', async () => {
      const argv = await buildYargs(['node', 'c8', '--lines', '100', '--config', require.resolve('./fixtures/config/.c8rc.json')])
      expect(argv.lines).to.equal(100)
    })

    it('should allow config files to extend each other', async () => {
      const argv = await buildYargs(['node', 'c8', '--lines', '100', '--config', require.resolve('./fixtures/config/.c8rc-base.json')])
      expect(argv.branches).to.equal(55)
      expect(argv.lines).to.equal(100)
      expect(argv.functions).to.be.equal(24)
    })
  })

  describe('--merge-async', () => {
    it('should default to false', async() => {
      const argv = await buildYargs(['node', 'c8'])
      // argv.mergeAsync.should.be.equal(false)
      expect(argv.mergeAsync).equal(false)
    })

    it('should set to true when flag exists', async() => {
      const argv = await buildYargs(['node', 'c8', '--merge-async'])
      // argv.mergeAsync.should.be.equal(true)
      expect(argv.mergeAsync).equal(true)
    })
  })
})
