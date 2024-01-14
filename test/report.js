/* global describe, it */
const { MockReport } = require('./report-mock.js')
const { buildYargs, hideInstrumenteeArgs } = require('../lib/parse-args')
const { existsSync, mkdirSync } = require('fs')
const { resolve } = require('path')
const chai = require('chai')
const spies = require('chai-spies')

chai.use(spies)
const { expect } = chai
const nodePath = process.execPath

describe('report', () => {
  /**
   * cause Report._loadReports to throw an error and catch it to increase code coverage
   *
   * Strategy:
   * Add a non json file to the temporary directory to cause _loadReports to throw
   * an error.  Do this before running reports constructor and after manually creating
   * the temporary directory
   *
   */
  it('cause Report._loadReports to throw an error and catch it', async () => {
    const cwd = process.cwd()
    const esmDirPath = resolve(cwd, 'tmp/esm')

    if (!existsSync(esmDirPath)) {
      mkdirSync(esmDirPath, { recursive: true })
    }

    const args = [
      'node', 'c8',
      '--exclude="test/*.js"',
      '--clean=false',
      '--temp-directory=tmp/esm',
      nodePath,
      '--experimental-modules',
      '--no-warnings',
      resolve('./fixtures/import.mjs')
    ]

    const report = MockReportTestCase(args)
    const testSpy = chai.spy
    await report.initSpies(testSpy, '_loadReports: throw error')

    const stdOutWriteStream = process.stdout.write
    // redirect stdout to /dev/null for a line
    process.stdout.write = () => {}
    try {
      await report.run()
    } catch (e) {
      console.error(e)
    } finally {
      process.stdout.write = stdOutWriteStream
      const spy = report.getSpy()
      expect(spy.toString()).equal('{ Spy }')
      expect(report._loadReports).to.have.been.called()
      expect(JSON.parse).to.have.been.called()
      testSpy.restore()
    }
  })

  /**
   * cause Report._normalizeProcessCov to throw an error and catch it to increase code
   * coverage
   *
   * Strategy:
   * fileIndex.add to throw an error
   * Function documentation
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/add
   *
   */
  it('cause Report._normalizeProcessCov to throw an error and catch it', async () => {
    const args = [
      'node', 'c8',
      '--exclude="test/*.js"',
      '--clean=false',
      '--temp-directory=tmp/esm',
      nodePath,
      '--experimental-modules',
      '--no-warnings',
      resolve('./fixtures/import.mjs')
    ]

    const report = MockReportTestCase(args)
    const testSpy = chai.spy
    await report.initSpies(testSpy, '_normalizeProcessCov: throw error')

    const stdOutWriteStream = process.stdout.write
    // redirect stdout to /dev/null for a line
    process.stdout.write = () => {}
    try {
      await report.run()
    } finally {
      process.stdout.write = stdOutWriteStream
      const spy = report.getSpy()
      expect(spy.toString()).equal('{ Spy }')
      expect(report._normalizeProcessCov).to.have.been.called()
      expect(Set.prototype.add).to.have.been.called()
      testSpy.restore()
    }
  })
  /**
   * cause Report._getMergedProcessCovAsync to throw an error and catch it to increase code
   * coverage
   *
   * Strategy:
   * Line 219 of report.js: JSON.parse to throw an error
   * Function documentation
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
   *
   * Todo: Fix Current error in Test Harness
   *
   * Might have something to do with async / await calls
   *
   * 3) report
   * cause Report._getMergedProcessCovAsync to throw an error and catch it:
   * AssertionError: expected { Spy 'object._getMergedProcessCovAsync' }
   * async () => {
   * if (this.setSpyOn === false) {
   *   this.spy.on(JSON, 'parse', (value) => {
   *     throw new Error('This is just a test error to improve code coverage')
   *   })
   *   this.setSpyOn = true
   * }
   * return await super._getMergedProcessCovAsync()
   * } to have been called
   * at Context.<anonymous> (test/report.js:154:61)
   */
  it('cause Report._getMergedProcessCovAsync to throw an error and catch it', async () => {
    // node bin/c8.js --exclude="test/*.js" --merge-async=true node ./test/fixtures/normal.js
    args = [
      'node',
      'c8',
      '--exclude="test/*.js"',
      `--merge-async=true`,
      'node',
      require.resolve('./fixtures/normal'),
      'report'
    ]

    const report = MockReportTestCase(args)
    const testSpy = chai.spy
    await report.initSpies(testSpy, '_getMergedProcessCovAsync: throw error')

    const stdOutWriteStream = process.stdout.write
    // redirect stdout to /dev/null for a line
    process.stdout.write = () => {}
    try {
      await report.run()
    } catch (e) {
      console.error(e)
    } finally {
      process.stdout.write = stdOutWriteStream
      const spy = report.getSpy()
      expect(spy.toString()).equal('{ Spy }')
      expect(report._getMergedProcessCovAsync).to.have.been.called()
      expect(JSON.parse).to.have.been.called()
      testSpy.restore()
    }
  })
})

const MockReportTestCase = (args) => {
  const pArgsv = process.argv
  process.argv = args
  const argv = buildYargs().parse(hideInstrumenteeArgs())
  process.argv = pArgsv
  const opts = {
    include: argv.include,
    exclude: argv.exclude,
    extension: argv.extension,
    excludeAfterRemap: argv.excludeAfterRemap,
    reporter: Array.isArray(argv.reporter) ? argv.reporter : [argv.reporter],
    reportsDirectory: argv['reports-dir'],
    tempDirectory: argv.tempDirectory,
    watermarks: argv.watermarks,
    resolve: argv.resolve,
    omitRelative: argv.omitRelative,
    wrapperLength: argv.wrapperLength,
    all: argv.all,
    allowExternal: argv.allowExternal,
    src: argv.src,
    skipFull: argv.skipFull,
    excludeNodeModules: argv.excludeNodeModules
  }

  const report = MockReport(opts)

  return report
}
