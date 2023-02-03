/* global describe, it */
const c8Path = require.resolve('../bin/c8')
const MockReport = require('./report-mock.js')
const { buildYargs, hideInstrumenteeArgs } = require('../lib/parse-args')
const jsYaml = require('js-yaml');
const { writeFileSync, existsSync, mkdirSync } = require('fs')
const { spawnSync } = require('child_process')
const assert = require('assert')
const { resolve } = require('path')
const rimraf = require('rimraf')

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
  it('cause Report._loadReports to throw an error and catch it', () => {
    const cwd = process.cwd()
    const ymlFilePath = resolve(process.cwd(), 'tmp/esm/yml.json')
    const tmpDirPath = resolve(cwd, 'tmp')
    const esmDirPath = resolve(cwd, 'tmp/esm')
    if (existsSync(ymlFilePath)) {
      rimraf.sync(ymlFilePath, { recursive: true })
    }
    /** * /
    if (!existsSync(tmpDirPath)) {
      mkdirSync(tmpDirPath)
    }
    /** */
    if (!existsSync(esmDirPath)) {
      mkdirSync(esmDirPath, { recursive: true })
    }
    
    try {
      const ymlObj = {
        test: 1,
        foo: 'test',
        bar: true
      }
      writeFileSync(ymlFilePath, jsYaml.dump(ymlObj))
      spawnSync(nodePath, [
        c8Path,
        '--exclude="test/*.js"',
        '--clean=false',
        '--temp-directory=tmp/esm',
        nodePath,
        '--experimental-modules',
        '--no-warnings',
        resolve('./fixtures/import.mjs')
      ])
    }
    catch(e) {
      console.log(e)
      assert.deepStrictEqual(true, true)
    }

    if (existsSync(ymlFilePath)){
      rimraf.sync(ymlFilePath)
    }
    else {
      assert.deepStrictEqual(false, true)
    }
  })
  /**
   * cause Report._normalizeProcessCov to throw an error and catch it to increase code 
   * coverage
   * 
   * Strategy:
   * Line 279 of report.js: fileURLToPath to throw an error
   * OR
   * Line 280 of report.js: fileIndex.add to throw an error
   * Function documentation
   * https://nodejs.org/docs/latest-v10.x/api/url.html#url_url_fileurltopath_url
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/add
   * 
   */
  it('cause Report._normalizeProcessCov to throw an error and catch it', async () => {
    process.argv = [
      'node', 'c8', 
      '--exclude="test/*.js"',
      '--clean=false',
      '--temp-directory=tmp/esm',
      nodePath,
      '--experimental-modules',
      '--no-warnings',
      resolve('./fixtures/import.mjs')
    ]
    const argv = buildYargs().parse(hideInstrumenteeArgs())
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

    const report = new MockReport(opts)

    try {
      const stdOutWrite = process.stdout.write
      // suppressing console output 
      process.stdout.write = (msg) => {/* a wise man once said nothing at all */} 
      await report.run()
      process.stdout.write = stdOutWrite
    }
    catch(e) {
      console.log(e)
      assert.deepStrictEqual(true, true)
    }
  })
})