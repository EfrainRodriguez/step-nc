import { ExceptionBase } from './base.exception';
import {
  SIMPLE_DATA_MAX_LENGTH_EXCEEDED_EXCEPTION,
  SIMPLE_DATA_REAL_PRECISION_NOT_ALLOWED_EXCEPTION,
  SIMPLE_DATA_STRING_MAX_LENGTH_NOT_ALLOWED_EXCEPTION
} from './codes.exception';

/**
 * This exception is thrown when a value exceeds the maximum length.
 */
export class SimpleDataMaxLengthExceededException extends ExceptionBase {
  code = SIMPLE_DATA_MAX_LENGTH_EXCEEDED_EXCEPTION;

  /**
   * Initializes a new instance of the class MaxLengthExceededException.
   * @param value The value that exceeds the maximum length.
   * @param maxLength The maximum length.
   */
  constructor(value: string, maxLength: number) {
    super(`The value ${value} exceeds the maximum length of ${maxLength}.`);
  }
}

/**
 * This exception is thrown when a real value has a precision that is not allowed.
 */
export class SimpleDataRealPrecisionNotAllowedException extends ExceptionBase {
  code = SIMPLE_DATA_REAL_PRECISION_NOT_ALLOWED_EXCEPTION;

  /**
   * Initializes a new instance of the class RealPrecisionNotAllowedException.
   * @param precision The precision value.
   */
  constructor(precision: number) {
    super(`The precision ${precision} is not allowed.`);
  }
}

/**
 * This exception is thrown when a string value has a length that is not allowed.
 */
export class SimpleDataStringMaxLengthNotAllowedException extends ExceptionBase {
  code = SIMPLE_DATA_STRING_MAX_LENGTH_NOT_ALLOWED_EXCEPTION;

  /**
   * Initializes a new instance of the class StringMaxLengthNotAllowedException.
   * @param maxLength The maximum length.
   */
  constructor(maxLength: number) {
    super(`The maximum length ${maxLength} is not allowed.`);
  }
}
