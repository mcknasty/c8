/* global it */

const { buildYargs } = require('../lib/parse-args')
const { mkdirSync, copyFileSync, rmSync } = require('fs')

const testPath = './test/fixtures/tmp-config-test'
const testReadingConfigFile = (fileNameLineNumberMap, filePath) => {
  Object.keys(fileNameLineNumberMap).forEach((fileName) => {
    
    it(`should be able to resolve config file ${fileName} with --config flag`, () => {
      // make the directory tmp-config-test
      mkdirSync(testPath)

      // Copy config file in fileName and test/fixtures/normal.js to dir above
      copyFileSync('./test/fixtures/normal.js', testPath + '/normal.js')
      copyFileSync('./test/fixtures/async.js', testPath + '/async.js')
      const expectedLines = fileNameLineNumberMap[fileName]
      const argv = buildYargs().parse([
        'node', 
        'c8', 
        '--config', 
        require.resolve(`${filePath}/${fileName}`)
      ])
      rmSync(testPath, { recursive: true, force: true })
      argv.lines.should.be.equal(expectedLines)
    })

    it(`should be able to resolve config file ${fileName} by detection`, () => {
      /** */
      // make the directory tmp-config-test
      mkdirSync(testPath)

      // Copy config file in fileName and test/fixtures/normal.js to dir above
      copyFileSync('./test/fixtures/normal.js', testPath + '/normal.js')
      copyFileSync('./test/fixtures/async.js', testPath + '/async.js')
      copyFileSync('./test/fixtures/config/' + fileName, testPath + '/' + fileName)
      /** */
      const expectedLines = fileNameLineNumberMap[fileName]
      
      // node bin/c8.js --temp-directory=tmp/normal --all --src=test/fixtures/tmp-config-test node test/fixtures/normal.js
      const { cwd } = require('node:process');
      console.error(`Current directory: ${cwd()}`);
      /** */
      const c8Path = require.resolve('../bin/c8')
      const nodePath = process.execPath
      args = [
        c8Path,
        '--temp-directory',
        './tmp/normal',
        '--all',
        '--src',
        './test/fixtures/tmp-config-test',
        nodePath,
        require.resolve('./fixtures/tmp-config-test/normal.js')
      ]
      const { output } = spawnSync(nodePath, args, './test/fixtures/tmp-config-test/')
      //const argv = buildYargs().parse(args)
      console.error(output)
      rmSync(testPath, { recursive: true, force: true })
      argv.lines.should.be.equal(expectedLines)
      /** */
    })
  })
}

const beforeTestReadingConfigFile = () => {
  // make the directory tmp-config-test
  mkdirSync(testPath)

  // Copy config file in fileName and test/fixtures/normal.js to dir above
  copyFileSync('./test/fixtures/normal.js', testPath + '/normal.js')
  copyFileSync('./test/fixtures/async.js', testPath + '/async.js')
}

const afterTestReadingConfigFile = () => {
  rmSync(testPath, { recursive: true, force: true })
}

module.exports = {
  testReadingConfigFile: testReadingConfigFile,
  beforeTestReadingConfigFile: beforeTestReadingConfigFile,
  afterTestReadingConfigFile: afterTestReadingConfigFile
}
