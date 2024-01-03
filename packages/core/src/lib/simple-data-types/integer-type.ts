import SimpleType from './simple-type';
import { InvalidDataTypeException } from '../exceptions';

/**
 * Represents the properties of the integer data type.
 */
export interface IntegerTypeProps {
  /**
   * The value of the integer data type originating from a literal JavaScript value.
   */
  value: number;
}

/**
 * The integer data type has as its domain all integer numbers. It is a specialization of the real
 * data type.
 * @see ISO-10303-11:2004 section 8.1.3 Integer data type
 */
class IntegerType extends SimpleType<number> {
  /**
   * Initializes a new instance of the integer data type.
   * @param props The properties of the integer data type. The properties are:
   * - value: The value of the integer data type originating from a literal JavaScript value.
   */
  constructor(props: IntegerTypeProps) {
    super(props);
    this.validate();
  }

  /**
   * This function returns a function for parsing a number to an instance of IntegerType.
   * @returns A function for parsing a number.
   */
  public static parse() {
    /**
     * This function parses a number to an instance of IntegerType.
     * @param value The number value to be parsed.
     */
    return (value: number) => new IntegerType({ value });
  }

  protected validate(): void {
    if (!Number.isInteger(this._value)) {
      throw new InvalidDataTypeException(this._value, IntegerType.name);
    }
  }
}

export default IntegerType;
