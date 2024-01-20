/* global describe, before, it */

const { rm } = require('fs')
const os = require('os')
const { expect } = require('chai')
const { resolve } = require('path')
const chaiJestSnapshot = require('chai-jest-snapshot')

const {
  runSpawn,
  textGetConfigKey
} = require('./print-config-helpers')

const {
  formatPrintVariable,
  cleanUpArgumentObject
} = require('../lib/print-config')

const { buildYargs } = require('../lib/parse-args')
const c8Path = require.resolve('../bin/c8')

require('chai')
  .use(chaiJestSnapshot)

const isWin = (os.platform() === 'win32')
const OsStr = (isWin) ? 'windows' : 'unix'
describe(`print derived configuration CLI option - ${OsStr}`, function () {
  before(cb => rm('tmp', { recursive: true, force: true }, cb))
  /**
   *
   *  Test: Ensure Valid JSON
   *  Command: c8 --print-config --print-config-format=json
   *
   *  ensure --print-config-format=json prints valid json document
   */
  it('ensure valid json', function () {
    chaiJestSnapshot.setTestName('ensure valid json')
    chaiJestSnapshot.setFilename(`./test/print-config-${OsStr}.js.snap`)

    try {
      const out = runSpawn([c8Path, '--print-config', '--print-config-format=json'])
      expect(out).to.matchSnapshot()
    } catch (e) {
      expect.fail('invalid json document produced from --print-config option')
    }
  })

  /**
   *
   *  Test: Ensure comma delimited values transform into an array
   *  Command: C8 --reporter=lcov,text --print-config --print-config-format=json
   *
   *  Todo:  There is a bug in yargs where this is not transformed into an array
   *   Skipping test for now
   */
  it.skip('ensure comma delimited values transform into an array', function () {
    const out = runSpawn([
      c8Path,
      '--reporter=lcov,text',
      '--print-config',
      '--print-config-format=json'
    ])

    expect(Object.keys(out).includes('reporter')).to.equal(true)
    expect(out.reporter).to.eql(['lcov', 'text'])
  })

  /**
   *
   *  Test: Ensure default project configuration file is loaded
   *  Command: c8  --print-config
   *
   */
  it('ensure default project configuration file is loaded', function () {
    const out = runSpawn([c8Path, '--print-config', '--print-config-format=json'])

    expect(Object.keys(out).includes('config')).to.equal(true)
    out.config.endsWith('.nycrc')
  })

  ;['text', 'json'].forEach((format) => {
    describe(`${format} format option`, function () {
      const textParam = format === 'text'

      /**
       *
       *  Test: ensure loads config file from cli
       *  Command: c8 -c ./test/fixtures/config/.c8rc.json --print-config --print-config-format=json|text
       *
       */
      it('ensure loads config file from cli', function () {
        // Can I shorten this line?
        const configFile = './test/fixtures/config/.c8rc.json'
        const out = runSpawn([
          c8Path,
          `--config=${configFile}`,
          '--print-config',
          `--print-config-format=${format}`
        ], textParam)

        if (format === 'json') // eslint-disable-line
          expect(Object.keys(out)
            .includes('config')).to.equal(true)

        const value = (format === 'json')
          ? out.config
          : textGetConfigKey(out, 'config')

        if (!value) // eslint-disable-line
          expect
            .fail('couldn\'t find configuration value for option --config')

        expect(value).to.eql(configFile)
      })

      /**
       *
       *  Test: Ensure loads reporter option from cli
       *  Command: c8 --reporter=lcov --print-config
       *
       */
      it('ensure loads reporter option from cli', function () {
        const out = runSpawn([
          c8Path,
          '--reporter=lcov',
          '--print-config',
          `--print-config-format=${format}`
        ], textParam)

        if (format === 'json') // eslint-disable-line
          expect(Object.keys(out)
            .includes('reporter')).to.equal(true)

        const value = (format === 'json')
          ? out.reporter
          : textGetConfigKey(out, 'reporter')

        if (!value) // eslint-disable-line
          expect
            .fail('couldn\'t find configuration value for option --reporter')

        // Todo: when the load comma delimited text array bug is fixed, need to adjust this line
        expect(value).to.eql('lcov')
      })
    })
  })

  // This test addresses a gap in the formatPrintVariable
  it('ensure objects can be printed in derived config display', function () {
    const testObject = {
      a: 'str1',
      b: 4,
      c: false,
      d: undefined,
      e: null,
      f: ['one', 'two', 'three'],
      g: {
        five: 'six',
        seven: false,
        eight: [
          {
            nine: 9,
            ten: '10'
          },
          {
            eleven: true,
            twelve: null
          }
        ]
      }
    }

    const output = formatPrintVariable(testObject, '').replace(/\s+/g, '')
    const expected = '{"a":"str1","b":4,"c":false,"e":null,"f":["one","two","three"],' +
      '"g":{"five":"six","seven":false,"eight":[{"nine":9,"ten":"10"},' +
      '{"eleven":true,"twelve":null}]}}'

    expect(output).to.equal(expected)
  })

  it('testing cleanUpArgumentObject function', function () {
    const args = Object.freeze([
      'node',
      'c8',
      '--print-config',
      '--lines',
      '100',
      '--config',
      require.resolve('./fixtures/config/.c8rc.json')
    ])
    const argsv = buildYargs().parse(args)
    const cleanArgs = cleanUpArgumentObject(argsv)

    const configPath = resolve('./test/fixtures/config/.c8rc.json')

    expect(cleanArgs.config).to.equal(configPath)

    const noCamelCaseKeys = Object.keys(cleanArgs)
      .map(v => [...v.matchAll(/([A-Z])/g)].length === 0)
      .reduce((prev, curr) => prev && curr)

    expect(noCamelCaseKeys).to.eql(true)
  })
})
