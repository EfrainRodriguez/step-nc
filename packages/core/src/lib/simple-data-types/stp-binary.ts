import { SimpleData } from './simple-data';
import {
  InvalidDataTypeException,
  SimpleDataMaxLengthExceededException,
  SimpleDataStringMaxLengthNotAllowedException
} from '../exceptions';
import { isValidStringMaxLength } from '../utils';

/**
 * The binary data type has as its domain sequences of bits, each bit being represented by 0 or 1.
 * @see ISO-10303-11:2004 8.1.7 Binary data type
 */
export class STPBinary extends SimpleData<string> {
  /**
   * Initializes a new instance of the STPBinary class.
   * It throws an exception if the value is not a string or if the length of the binary value exceeds
   * the maximum length.
   * @param value The binary value
   * @param _maxLength The maximum length of the binary value
   */
  constructor(value: string, private readonly _maxLength?: number | undefined) {
    super(value);
    this.validate();
  }

  /**
   * Converts a hexadecimal string to a STPBinary object.
   * @param value The hexadecimal string
   * @returns A string that represents the current STPBinary object.
   */
  static fromHex(value: string, maxLength?: number | undefined): STPBinary {
    if (!/^[0-9A-Fa-f]+$/.test(value)) {
      throw new InvalidDataTypeException(value, STPBinary.name);
    }
    if (maxLength === undefined) {
      maxLength = value.length * 4;
    }
    return new STPBinary(
      value
        .split('')
        .map((bit) => parseInt(bit, 16).toString(2).padStart(4, '0'))
        .join(''),
      maxLength
    );
  }

  protected validate(): void {
    if (typeof this._value !== 'string') {
      throw new InvalidDataTypeException(this._value, STPBinary.name);
    }
    if (!/^[01]+$/.test(this._value)) {
      throw new InvalidDataTypeException(this._value, STPBinary.name);
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
