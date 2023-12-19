import SimpleType from './simple-type';
import { InvalidDataTypeException } from '../exceptions';

/**
 * Represents the properties of the logical data type.
 */
export interface LogicalTypeProps {
  /**
   * The value of the logical data type originating from a literal JavaScript value.
   */
  value: boolean | undefined;
}

/**
 * The logical data type has as its domain the three literals true, false, and unknown.
 * Here, undefined type is used to represent unknown.
 * @see ISO-10303-11:2004 section 8.1.4 Logical data type
 */
class LogicalType extends SimpleType<boolean | undefined> {
  /**
   * Initializes a new instance of the logical data type.
   * @param props The properties of the logical data type. The properties are:
   * - value: The value of the logical data type originating from a literal JavaScript value.
   */
  constructor(props: LogicalTypeProps) {
    super(props);
    this.validate();
  }

  /**
   * This function returns a function for parsing a boolean or undefined value to an instance of LogicalType.
   * @returns A function for parsing a boolean or undefined value.
   */
  public static parse() {
    /**
     * This function parses a boolean or undefined value to an instance of LogicalType.
     * @param value The boolean or undefined value to be parsed.
     */
    return (value: boolean | undefined) => new LogicalType({ value });
  }

  protected validate(): void {
    if (typeof this._value !== 'boolean' && this._value !== undefined) {
      throw new InvalidDataTypeException(this._value, LogicalType.name);
    }
  }
}

export default LogicalType;
