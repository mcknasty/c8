/* global describe, it */

const { expect } = require('chai')

const {
  UnsupportedFileTypeError,
  ConfigParsingError
} = require('../lib/error-reporting')

describe('c8 error handling', () => {
  describe(ConfigParsingError.name, () => {
    it('is an Error subclass', () => {
      expect(new ConfigParsingError('', '')).to.be.instanceof(Error)
    })

    it('has the correct static name property', () => {
      expect(ConfigParsingError).to.have.property('name', 'ConfigParsingError')
    })

    it('creates the correct error message when not provided an original error', () => {
      expect(
        new ConfigParsingError('path/goes/here', 'a hint.')
      ).to.have.property(
        'message',
        'Error loading configuration from file "path/goes/here": a hint.'
      )
    })

    it('creates the correct error message when provided an original error', () => {
      expect(
        new ConfigParsingError(
          'path/goes/here',
          'a hint.',
          new Error('some error thrown by a parsing engine')
        )
      ).to.have.property(
        'message',
        'Error loading configuration from file "path/goes/here": a hint. Original error: some error thrown by a parsing engine'
      )
    })
  })

  describe(UnsupportedFileTypeError.name, () => {
    it('is an Error subclass', () => {
      expect(new UnsupportedFileTypeError('', [])).to.be.instanceof(Error)
    })

    it('has the correct static name property', () => {
      expect(UnsupportedFileTypeError).to.have.property(
        'name',
        'UnsupportedFileTypeError'
      )
    })

    it('creates the correct error message', () => {
      expect(
        new UnsupportedFileTypeError('path/goes/here', [
          'fileType1',
          'fileType2'
        ])
      ).to.have.property(
        'message',
        'Unsupported file type while reading file "path/goes/here". Please make sure your file of one of the following file types: fileType1, fileType2'
      )
    })
  })
})
