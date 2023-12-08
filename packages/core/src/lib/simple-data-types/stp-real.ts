import { SimpleData } from './simple-data';
import {
  SimpleDataInvalidValueException,
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

  protected validate(): void {
    if (!isValidNumber(this._value)) {
      throw new SimpleDataInvalidValueException(this._value, STPReal.name);
    }
    if (this._precision !== undefined) {
      if (!isValidRealPrecision(this._precision)) {
        throw new SimpleDataRealPrecisionNotAllowedException(this._precision);
      }
    }
  }
}
