const { extname } = require('path')

class UnsupportedFileTypeError extends Error {
  constructor (path) {
    const ext = extname(path).toLowerCase()

    super(
      `Unsupported file type ${ext} while reading file ${path}`
    )
    this.name = UnsupportedFileTypeError.name
  }
}

/**
 * Refactor Todo:
 *
 * Not sure if this the name we want to use for this class
 * In the parameters it supports an error that has already
 * been thrown, then appends it's own error message
 * Is there a more general name we can use like
 * AppendableError or MultiError?  Is this a good
 * Canidate for the decorator design pattern?
 *
 *
 * Note: this is different than javascript Decorators
 *
 */
class ConfigParsingError extends Error {
  constructor (path, errorDetails, originalError) {
    const orgErrorMsg = (originalError instanceof Error)
      ? ` Original error: ${originalError.message}`
      : ''

    super(
      `Error loading configuration from file ${path}: ${errorDetails}` + orgErrorMsg
    )

    this.name = UnsupportedFileTypeError.name

    if (originalError instanceof Error) {
      this.stack = originalError.stack
    }
  }
}

module.exports = {
  UnsupportedFileTypeError,
  ConfigParsingError
}
