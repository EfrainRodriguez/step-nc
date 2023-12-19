import { ExceptionBase } from './base.exception';
import {
  SIMPLE_DATA_INVALID_EXPECTED_STRING_WIDTH_EXCEPTION,
  SIMPLE_DATA_REAL_PRECISION_NOT_ALLOWED_EXCEPTION,
  SIMPLE_DATA_STRING_WIDTH_NOT_ALLOWED_EXCEPTION
} from './codes.exception';

/**
 * This exception is thrown when a string value has a length that does not match the expected length.
 */
export class SimpleTypeInvalidExpectedStringWidthException extends ExceptionBase {
  code = SIMPLE_DATA_INVALID_EXPECTED_STRING_WIDTH_EXCEPTION;

  /**
   * Initializes a new instance of the class SimpleTypeInvalidExpectedStringWidthException.
   * @param value The value that exceeds the maximum length.
   * @param width The maximum length of the string.
   */
  constructor(value: string, width: number, type: string) {
    super(
      `The string width ${value?.length} does not match the expected width ${width} of the current type ${type}.`
    );
  }
}

/**
 * This exception is thrown when a real value has a precision that is not allowed.
 */
export class SimpleTypeRealPrecisionNotAllowedException extends ExceptionBase {
  code = SIMPLE_DATA_REAL_PRECISION_NOT_ALLOWED_EXCEPTION;

  /**
   * Initializes a new instance of the class SimpleTypeRealPrecisionNotAllowedException.
   * @param precision The precision value.
   */
  constructor(precision: number) {
    super(`The precision ${precision} is not allowed.`);
  }
}

/**
 * This exception is thrown when a string value has a width that is not allowed.
 */
export class SimpleTypeStringWidthNotAllowedException extends ExceptionBase {
  code = SIMPLE_DATA_STRING_WIDTH_NOT_ALLOWED_EXCEPTION;

  /**
   * Initializes a new instance of the class SimpleTypeStringWidthNotAllowedException.
   * @param width The maximum length of the string.
   */
  constructor(width: number) {
    super(`The maximum length ${width} is not allowed.`);
  }
}
