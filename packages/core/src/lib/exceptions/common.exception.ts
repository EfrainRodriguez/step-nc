import { ExceptionBase } from './base.exception';
import { INVALID_DATA_TYPE_EXCEPTION } from './codes.exception';

/**
 * This exception is thrown when an invalid data type is used.
 */
export class InvalidDataTypeException extends ExceptionBase {
  code = INVALID_DATA_TYPE_EXCEPTION;

  /**
   * Initializes a new instance of the class InvalidDataTypeException.
   * @param value The invalid value.
   * @param type The type of the value.
   */
  constructor(value: unknown, type: string) {
    super(`The value ${String(value)} is not a valid ${type}.`);
  }
}
