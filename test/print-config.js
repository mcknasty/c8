/* global describe, before, beforeEach, it */

const { rm } = require('fs')
const { runSpawn, cleanJson, textGetConfigKey } = require('./print-config-helpers')
const c8Path = require.resolve('../bin/c8')
const nodePath = process.execPath
const chaiJestSnapshot = require('chai-jest-snapshot')
const pwd = process.cwd()
const { should } = require('chai')

// Todo: when bug mentioned below is fixed uncomment
// const { expect, should } = require('chai')

require('chai').should()
require('chai')
  .use(chaiJestSnapshot)
  .should()

before(cb => rm('tmp', { recursive: true, force: true }, cb))

beforeEach(function () {
  chaiJestSnapshot.configureUsingMochaContext(this)
})

describe('Help Message', () => {
  // Ensure the help message is correct - Snapshot of help message
  /**
   *   Test: Ensure Help Message is Correct
   *   Command: c8 --help
   *
   *   Runs the hep option and compares to a snapshot
   */
  it('ensure the help message is correct', () => {
    const output = runSpawn([c8Path, '--help'])
      .replaceAll(pwd, '.')
      .replaceAll(' ', '')
    output.should.matchSnapshot()
  })

  /**
   *  Test: Ensure 'not enough non-option arguments' warning message
   *  Command: c8
   *
   *  Runs c8 with incorrect options to make sure it produces a warning
   *
   */
  it('ensure \'not enough non-option arguments\' warning message', () => {
    const output = runSpawn([c8Path])
      .replaceAll(pwd, '.')
      .replaceAll(' ', '')
    output.should.matchSnapshot()
  })
})

describe('Print derived configuration CLI option', () => {
  // if print-config is true, c8 shouldn't demand any arguments
  /**
   *
   *  Test: should not demand any arguments: --print-config=true
   *  Command: c8 --print-config=true
   *
   *  if print-config is true, c8 shouldn't demand any arguments
   *
   */
  it('should not demand any arguments: --print-config=true', () => {
    const out = runSpawn([c8Path, '--print-config=true']).replaceAll(pwd, '.')
    out.should.matchSnapshot()
  })

  /**
   *
   *  Test: should not demand any arguments: --print-config
   *  Command: c8  --print-config
   *
   *  Other variation of if print-config is true, c8 shouldn't
   *  demand any arguments
   *
   */
  it('should not demand any arguments: --print-config', () => {
    const out = runSpawn([c8Path, '--print-config']).replaceAll(pwd, '.')
    out.should.matchSnapshot()
  })

  /**
   *
   *  Test: should demand arguments: --print-config=false
   *  Command: c8 --print-config=false
   *
   */
  it('should demand arguments: --print-config=false', () => {
    // Run Command./bin/c8.js --print-config=false
    const out = runSpawn([c8Path, '--print-config=false'])
      .replaceAll(pwd, '.')
      .replaceAll(' ', '')

    out.should.matchSnapshot()
  })

  /**
   *
   *  Test: should not demand arguments: --print-config=false
   *  Command: c8 --print-config=false --temp-directory=tmp/vanilla-all \
   *   --clean=false --all=true --include=test/fixtures/all/vanilla/**\/*.js
   *   --exclude=**\/*.ts node ./fixtures/all/vanilla/main
   *
   */
  it('should not demand arguments: --print-config=false', () => {
    const args = [
      c8Path,
      '--print-config=false',
      '--temp-directory=tmp/vanilla-all',
      '--clean=false',
      '--all=true',
      '--include=test/fixtures/all/vanilla/**/*.js',
      '--exclude=**/*.ts', // add an exclude to avoid default excludes of test/**
      nodePath,
      require.resolve('./fixtures/all/vanilla/main')
    ]
    const out = runSpawn(args).replaceAll(pwd, '.')
    out.should.matchSnapshot()
  })

  /**
   *
   *  Test: Ensure Valid JSON
   *  Command: c8 --print-config --print-config-format=json
   *
   *  ensure --print-config-format=json prints valid json document
   */
  it('ensure valid json', () => {
    const out = runSpawn([c8Path, '--print-config', '--print-config-format=json']).replaceAll(pwd, '.')
    try {
      const jOut = cleanJson(out)
      jOut.should.matchSnapshot()
    } catch (e) {
      should.fail('invalid json document produced from --print-config option')
    }
  })

  /**
   *
   *  Test: Ensure comma delimited values transform into an array
   *  Command: C8 --reporter=lcov,text --print-config --print-config-format=json
   *
   *  Todo:  There is a bug in yargs where this is not transformedd into an array
   *   Skipping test for now
   */
  it('ensure comma delimited values transform into an array', function () {
    this.skip()
    const out = runSpawn([
      c8Path,
      '--reporter=lcov,text',
      '--print-config',
      '--print-config-format=json'
    ]).replaceAll(pwd, '.')

    const jOut = cleanJson(out)

    const includesKey = Object.keys(jOut).includes('reporter')
    const checkFor = ['lcov', 'text']
    includesKey.should.eql(true)
    jOut.reporter.should.eql(checkFor)
  })

  /**
   *
   *  Test: Ensure default project configuration file is loaded
   *  Command: c8  --print-config
   *
   */
  it('ensure default project configuration file is loaded', () => {
    const out = runSpawn([c8Path, '--print-config', '--print-config-format=json']).replaceAll(pwd, '.')
    const jOut = cleanJson(out)

    const includesKey = Object.keys(jOut).includes('config')
    includesKey.should.eql(true)
    jOut.config.should.eql('./.nycrc')
  })

  ;['text', 'json'].forEach((format) => {
    describe(`${format} format option`, () => {
      /**
       *
       *  Test: ensure loads config file from cli
       *  Command: c8 -c ./test/fixtures/config/.c8rc.json --print-config --print-config-format=json|text
       *
       */
      it('ensure loads config file from cli', () => {
        const out = runSpawn([
          c8Path,
          '--config=./test/fixtures/config/.c8rc.json',
          '--print-config',
          `--print-config-format=${format}`
        ]).replaceAll(pwd, '.')

        if (format === 'json') {
          const jOut = cleanJson(out)

          Object.keys(jOut).includes('config').should.eql(true)
          jOut.config.should.eql('./test/fixtures/config/.c8rc.json')
        } else if (format === 'text') {
          const value = textGetConfigKey(out, 'config')
          if (value) {
            value.should.eql('./test/fixtures/config/.c8rc.json')
          } else {
            should.fail('couldn\'t find configuration value for option --config')
          }
        }
      })

      /**
       *
       *  Test: Ensure loads reporter option from cli
       *  Command: c8 --reporter=lcov --print-config
       *
       */
      it('ensure loads reporter option from cli', () => {
        const out = runSpawn([
          c8Path,
          '--reporter=lcov',
          '--print-config',
          `--print-config-format=${format}`
        ]).replaceAll(pwd, '.')

        if (format === 'json') {
          const jOut = cleanJson(out)

          Object.keys(jOut).includes('reporter').should.eql(true)
          jOut.reporter.should.eql('lcov')
        } else if (format === 'text') {
          const value = textGetConfigKey(out, 'reporter')
          if (value) {
            // Todo: when the load comma delimited text array bug is fixed, need to adjust this line
            value.should.eql('lcov')
          } else {
            should.fail('couldn\'t find configuration value for option --reporter')
          }
        }
      })
    })
  })
})
