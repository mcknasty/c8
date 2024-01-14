const Report = require('../lib/report.js')

const ReportClass = Report({}, true)

// Might want to look at Simple Mock, if Chai-spies continues to cause problems
//https://github.com/jupiter/simple-mock
class MockReport extends ReportClass {
  constructor (opts) {
    super(opts)
  }

  getSpy () {
    return this.spy()
  }

  async initSpies (spy, testCaseKey) {
    this.spy = spy

    this.setSpyOn = false
    if (testCaseKey === '_normalizeProcessCov: throw error') {
      this._normalizeProcessCovSpy()
    } else if (testCaseKey === '_loadReports: throw error') {
      this._loadReportsSpy()
    } else if (testCaseKey === '_getMergedProcessCovAsync: throw error') {
      await this._getMergedProcessCovAsyncSpy()
    }
  }

  _normalizeProcessCovSpy () {
    this.spy.on(this, '_normalizeProcessCov', (v8ProcessCov, fileIndex) => {
      if (this.setSpyOn === false) {
        this.spy.on(Set.prototype, 'add', (value) => {
          throw new Error('This is just a test error to improve code coverage')
        })
        this.setSpyOn = true
      }
      return super._normalizeProcessCov(v8ProcessCov, fileIndex)
    })
  }

  _loadReportsSpy () {
    this.spy.on(this, '_loadReports', () => {
      if (this.setSpyOn === false) {
        this.spy.on(JSON, 'parse', (value) => {
          throw new Error('This is just a test error to improve code coverage')
        })
        this.setSpyOn = true
      }
      return super._loadReports()
    })
  }

  async _getMergedProcessCovAsyncSpy () {
    await this.spy.on(this, '_getMergedProcessCovAsync', async () => {
      if (this.setSpyOn === false) {
        this.spy.on(JSON, 'parse', (value) => {
          throw new Error('This is just a test error to improve code coverage')
        })
        this.setSpyOn = true
      }
      return await super._getMergedProcessCovAsync()
    })
  }
}

module.exports = {
  MockReport: function (opts, spy, testCaseKey) {
    return new MockReport(opts, spy, testCaseKey)
  },
  MockReportClass: MockReport
}
