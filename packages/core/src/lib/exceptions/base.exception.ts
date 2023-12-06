/**
 * This interface is used to serialize exceptions to JSON.
 */
interface SerializedException {
  message: string;
  code: string;
  stack?: string;
}

/**
 * This is the base class for all exceptions.
 */
export abstract class ExceptionBase extends Error {
  abstract code: string;

  /**
   * Initializes a new instance of the class extending the class ExceptionBase.
   * @param message The message of the exception.
   */
  constructor(override readonly message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }

  serialize(): SerializedException {
    return {
      message: this.message,
      code: this.code,
      stack: this.stack
    };
  }
}
