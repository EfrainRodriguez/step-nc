import { SimpleData } from './simple-data';
import { InvalidDataTypeException } from '../exceptions';

/**
 * The logical data type has as its domain the three types true, false, and unknown.
 * Here, undefined type is used to represent unknown.
 */
export type LogicalBase = boolean | undefined;

/**
 * The logical data type has as its domain the three literals true, false, and unknown.
 * Here, undefined type is used to represent unknown.
 * @see ISO-10303-11:2004 8.1.4 Logical data type
 */
export class STPLogical extends SimpleData<LogicalBase> {
  /**
   * Initializes a new instance of the logical data type.
   * @param value The value.
   */
  constructor(value: LogicalBase) {
    super(value);
    this.validate();
  }

  /**
   * This function returns a function for parsing a boolean or undefined value to an instance of STPLogical.
   * @returns A function for parsing a boolean or undefined value.
   */
  public static parse() {
    /**
     * This function parses a boolean or undefined value to an instance of STPLogical.
     * @param value The boolean or undefined value to be parsed.
     */
    return (value: LogicalBase) => new STPLogical(value);
  }

  protected validate(): void {
    if (typeof this._value !== 'boolean' && this._value !== undefined) {
      throw new InvalidDataTypeException(this._value, STPLogical.name);
    }
  }
}
