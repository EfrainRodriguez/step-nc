import { SimpleData } from './simple-data';
import { SimpleDataInvalidValueException } from '../exceptions';

/**
 * The boolean data type has as its domain the two literals true and false. The boolean data
 * type is a specialization of the logical data type.
 * @see ISO-10303-11:2004 8.1.5 Boolean data type
 */
export class STPBoolean extends SimpleData<boolean> {
  protected validate(): void {
    if (typeof this._value !== 'boolean') {
      throw new SimpleDataInvalidValueException(this._value, STPBoolean.name);
    }
  }
}
