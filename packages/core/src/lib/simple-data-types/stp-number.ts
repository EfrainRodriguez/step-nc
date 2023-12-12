import { SimpleData } from './simple-data';
import { InvalidDataTypeException } from '../exceptions';
import { isValidNumber } from '../utils';

/**
 * The number data type has as its domain all numeric values in the language. The number data
 * type shall be used when a more specific numeric representation is not important.
 * @see ISO-10303-11:2004 8.1.1 Number data type
 */
export class STPNumber extends SimpleData<number> {
  /**
   * Initializes a new instance of the number data type.
   * @param value The value.
   */
  constructor(value: number) {
    super(value);
    this.validate();
  }

  /**
   * This function returns a function for parsing a number to an instance of STPNumber.
   * @returns A function for parsing a number.
   */
  public static parse() {
    /**
     * This function parses a number to an instance of STPNumber.
     * @param value The number value to be parsed.
     */
    return (value: number) => new STPNumber(value);
  }

  protected validate(): void {
    if (!isValidNumber(this._value)) {
      throw new InvalidDataTypeException(this._value, STPNumber.name);
    }
  }
}
