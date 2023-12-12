import { SimpleData } from './simple-data';
import { InvalidDataTypeException } from '../exceptions';

/**
 * The boolean data type has as its domain the two literals true and false. The boolean data
 * type is a specialization of the logical data type.
 * @see ISO-10303-11:2004 8.1.5 Boolean data type
 */
export class STPBoolean extends SimpleData<boolean> {
  /**
   * Initializes a new instance of the boolean data type.
   * @param value The value.
   */
  constructor(value: boolean) {
    super(value);
    this.validate();
  }

  /**
   * This function returns a function for parsing a boolean value to an instance of STPBoolean.
   * @returns A function for parsing a boolean value.
   */
  public static parse() {
    /**
     * This function parses a boolean value to an instance of STPBoolean.
     * @param value The boolean value to be parsed.
     */
    return (value: boolean) => new STPBoolean(value);
  }

  protected validate(): void {
    if (typeof this._value !== 'boolean') {
      throw new InvalidDataTypeException(this._value, STPBoolean.name);
    }
  }
}
