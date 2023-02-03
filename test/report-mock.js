const chai = require('chai')
const spies = require('chai-spies')
const { ReportClass } = require('../lib/report.js')

chai.use(spies)

class MockReport extends ReportClass {
  _getMergedProcessCov () {
    const { mergeProcessCovs } = require('@bcoe/v8-coverage')
    const v8ProcessCovs = []
    const fileIndex = new Set() // Set<string>
    chai.spy.on(fileIndex, 'add', (value) => {
      throw new Error('This is just a test error to improve code coverage')
    })
    for (const v8ProcessCov of this._loadReports()) {
      if (this._isCoverageObject(v8ProcessCov)) {
        if (v8ProcessCov['source-map-cache']) {
          Object.assign(this.sourceMapCache, this._normalizeSourceMapCache(v8ProcessCov['source-map-cache']))
        }
        v8ProcessCovs.push(this._normalizeProcessCov(v8ProcessCov, fileIndex))
      }
    }

    if (this.all) {
      const emptyReports = []
      v8ProcessCovs.unshift({
        result: emptyReports
      })
      const workingDirs = this.src
      const { extension } = this.exclude
      for (const workingDir of workingDirs) {
        this.exclude.globSync(workingDir).forEach((f) => {
          const fullPath = resolve(workingDir, f)
          if (!fileIndex.has(fullPath)) {
            const ext = extname(fullPath)
            if (extension.includes(ext)) {
              const stat = statSync(fullPath)
              const sourceMap = getSourceMapFromFile(fullPath)
              if (sourceMap) {
                this.sourceMapCache[pathToFileURL(fullPath)] = { data: sourceMap }
              }
              emptyReports.push({
                scriptId: 0,
                url: resolve(fullPath),
                functions: [{
                  functionName: '(empty-report)',
                  ranges: [{
                    startOffset: 0,
                    endOffset: stat.size,
                    count: 0
                  }],
                  isBlockCoverage: true
                }]
              })
            }
          }
        })
      }
    }

    return mergeProcessCovs(v8ProcessCovs)
  }
}


module.exports = MockReport