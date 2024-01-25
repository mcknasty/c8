/* TODO: Refactor:
 *
 * Not sure if this the name we want to use for this class
 * In the parameters it supports an error that has already
 * been thrown, then appends it's own error message
 * Is there a more general name we can use like
 * AppendableError or MultiError?  Is this a good
 * Candidate for the decorator design pattern?
 *
 *
 * Note: this is different than javascript Decorators
 */
/**
 * To be thrown when there's a problem parsing a configuration file.
 *
 * More often than not the errors from the parsing engines are opaque and
 * unhelpful, so this gives us the opportunity to provide better information
 * to the user.
 */
class ConfigParsingError extends Error {
  /**
   * Constructs the error, given the path and error hints.
   *
   * @param {string} path The path to the file that had a parsing problem.
   * @param {string} errorHints Any user-helpful hints.
   * @param {unknown} [originalError] Optional: The original error thrown by the underlying parser.
   */
  constructor (path, errorHints, originalError) {
    const originalErrorMessage =
      originalError instanceof Error
        ? ` Original error: ${originalError.message}`
        : ''

    super(
      `Error loading configuration from file "${path}": ${errorHints}${originalErrorMessage}`
    )

    // this.name = ConfigParsingError.name

    if (originalError instanceof Error) {
      this.stack = originalError.stack
    }
  }
}

/**
 * To be thrown when a file is loaded that is not one of the supported file
 * types, especially when the file type is determined from the file extension.
 */
class UnsupportedFileTypeError extends Error {
  /**
   * Constructs the error, given the path and supported file types.
   *
   * @param {string} path The path to the file that is not supported.
   * @param {string[]} supportedFileTypes An array of supported file types that will help the user understand when they need to do.
   */
  constructor (path, supportedFileTypes) {
    const types = supportedFileTypes.join(', ')
    super(
      `Unsupported file type while reading file "${path}". Please make sure your file of one of the following file types: ${types}`
    )
    // this.name = UnsupportedFileTypeError.name
  }
}

module.exports = {
  ConfigParsingError,
  UnsupportedFileTypeError
}
