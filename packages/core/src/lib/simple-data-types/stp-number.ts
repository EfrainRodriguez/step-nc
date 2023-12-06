import { SimpleData } from './simple-data';
import { SimpleDataInvalidValueException } from '../exceptions';
import { isValidNumber } from '../utils/validations.utils';

/**
 * The number data type has as its domain all numeric values in the language. The number data
 * type shall be used when a more specific numeric representation is not important.
 * @see ISO-10303-11:2004 8.1.1 Number data type
 */
export class STPNumber extends SimpleData<number> {
  protected validate(): void {
    if (!isValidNumber(this._value)) {
      throw new SimpleDataInvalidValueException(this._value, STPNumber.name);
    }
  }
}
