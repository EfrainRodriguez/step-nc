import { SimpleData } from './simple-data';
import { InvalidDataTypeException } from '../exceptions';

/**
 * The integer data type has as its domain all integer numbers. It is a specialization of the real
 * data type.
 * @see ISO-10303-11:2004 8.1.3 Integer data type
 */
export class STPInteger extends SimpleData<number> {
  /**
   * Initializes a new instance of the integer data type.
   * @param value The value.
   */
  constructor(value: number) {
    super(value);
    this.validate();
  }
  
  protected validate(): void {
    if (!Number.isInteger(this._value)) {
      throw new InvalidDataTypeException(this._value, STPInteger.name);
    }
  }
}
