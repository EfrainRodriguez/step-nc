import SimpleType from './simple-type';
import { InvalidDataTypeException } from '../exceptions';
import { isValidNumber } from '../utils';

/**
 * Represents the properties of the number data type.
 */
export interface NumberTypeProps {
  /**
   * The value of the number data type originating from a literal JavaScript value.
   */
  value: number;
}

/**
 * The number data type has as its domain all numeric values in the language. The number data
 * type shall be used when a more specific numeric representation is not important.
 * @see ISO-10303-11:2004 section 8.1.1 Number data type
 */
class NumberType extends SimpleType<number> {
  /**
   * Initializes a new instance of the number data type.
   * @param props The properties of the number data type. The properties are:
   * - value: The value of the number data type originating from a literal JavaScript value.
   */
  constructor(props: NumberTypeProps) {
    super(props);
    this.validate();
  }

  /**
   * This function returns a function for parsing a number to an instance of NumberType.
   * @returns A function for parsing a number.
   */
  public static parse() {
    /**
     * This function parses a number to an instance of NumberType.
     * @param value The number value to be parsed.
     */
    return (value: number) => new NumberType({ value });
  }

  protected validate(): void {
    if (!isValidNumber(this._value)) {
      throw new InvalidDataTypeException(this._value, NumberType.name);
    }
  }
}

export default NumberType;
