import SimpleType from './simple-type';
import { InvalidDataTypeException } from '../exceptions';

/**
 * Represents the properties of the boolean data type.
 */
export interface BooleanTypeProps {
  /**
   * The value of the boolean data type originating from a literal JavaScript value.
   */
  value: boolean;
}

/**
 * The boolean data type has as its domain the two literals true and false. The boolean data
 * type is a specialization of the logical data type.
 * @see ISO-10303-11:2004 section 8.1.5 Boolean data type
 */
class BooleanType extends SimpleType<boolean> {
  /**
   * Initializes a new instance of the boolean data type.
   * @param props The properties of the boolean data type. The properties are:
   * - value: The value of the boolean data type originating from a literal JavaScript value.
   */
  constructor(props: BooleanTypeProps) {
    super(props);
    this.validate();
  }

  /**
   * This function returns a function for parsing a boolean value to an instance of BooleanType.
   * @returns A function for parsing a boolean value.
   */
  public static parse() {
    /**
     * This function parses a boolean value to an instance of BooleanType.
     * @param value The boolean value to be parsed.
     */
    return (value: boolean) => new BooleanType({ value });
  }

  protected validate(): void {
    if (typeof this._value !== 'boolean') {
      throw new InvalidDataTypeException(this._value, BooleanType.name);
    }
  }
}

export default BooleanType;
