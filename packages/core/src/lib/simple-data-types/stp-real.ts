import { SimpleData } from './simple-data';
import {
  InvalidDataTypeException,
  SimpleDataRealPrecisionNotAllowedException
} from '../exceptions';
import { isValidNumber, isValidRealPrecision } from '../utils';

/**
 * The real data type has as its domain all rational, irrational and scientific real numbers. It is
 * a specialization of the number data type.
 * @see ISO-10303-11:2004 8.1.2 Real data type
 */
export class STPReal extends SimpleData<number> {
  /**
   * Initializes a new instance of the STPReal class.
   * @param value The real value
   * @param _precision The precision of the real value
   */
  constructor(value: number, private readonly _precision?: number | undefined) {
    super(value);
    this.validate();
    if (this._precision !== undefined) {
      this._value = Number(this._value.toFixed(this._precision));
    }
  }

  /**
   * This function returns a function for parsing a number to an instance of STPReal.
   * @param options Options for parsing the number. The options are:
   * - precision: The precision of the real value.
   * @returns A function for parsing a number.
   */
  public static parse(options?: { precision?: number }) {
    /**
     * This function parses a number to an instance of STPReal.
     * @param value The number value to be parsed.
     */
    return (value: number) => new STPReal(value, options?.precision);
  }

  protected validate(): void {
    if (!isValidNumber(this._value)) {
      throw new InvalidDataTypeException(this._value, STPReal.name);
    }
    if (this._precision !== undefined) {
      if (!isValidRealPrecision(this._precision)) {
        throw new SimpleDataRealPrecisionNotAllowedException(this._precision);
      }
    }
  }
}
