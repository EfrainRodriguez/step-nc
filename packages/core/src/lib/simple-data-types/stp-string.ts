import { SimpleData } from './simple-data';
import {
  SimpleDataInvalidValueException,
  SimpleDataMaxLengthExceededException,
  SimpleDataStringMaxLengthNotAllowedException
} from '../exceptions';
import { isValidStringMaxLength } from '../utils/validations.utils';

/**
 * The string data type has as its domain sequences of characters. The characters that are
 * permitted as part of a string value are those characters allocated to cells 09, 0A, 0D and the
 * graphic characters lying in the ranges 20 to 7E and A0 to 10FFFE of ISO/IEC 10646.
 * @see ISO-10303-11:2004 8.1.6 String data type
 */
export class STPString extends SimpleData<string> {
  /**
   * Initializes a new instance of the STPString class.
   * It throws an exception if the value is not a string or if the length of the string exceeds
   * the maximum length.
   * @param value The string value
   * @param _maxLength The maximum length of the string
   */
  constructor(value: string, private readonly _maxLength?: number | undefined) {
    super(value);
    this.validate();
  }

  protected validate(): void {
    if (typeof this._value !== 'string') {
      throw new SimpleDataInvalidValueException(this._value, STPString.name);
    }
    if (this._maxLength !== undefined) {
      if (!isValidStringMaxLength(this._maxLength)) {
        throw new SimpleDataStringMaxLengthNotAllowedException(this._maxLength);
      }
      if (this._value.length > this._maxLength) {
        throw new SimpleDataMaxLengthExceededException(
          this._value,
          this._maxLength
        );
      }
    }
  }
}
