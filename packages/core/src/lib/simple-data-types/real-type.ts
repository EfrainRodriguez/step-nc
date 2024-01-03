import SimpleType from './simple-type';
import {
  InvalidDataTypeException,
  SimpleTypeRealPrecisionNotAllowedException
} from '../exceptions';
import { isValidNumber, isValidRealPrecision } from '../utils';

/**
 * Represents the properties of the real data type.
 */
export interface RealTypeProps {
  /**
   * The value of the real data type originating from a literal JavaScript value.
   */
  value: number;
  /**
   * The precision of the real value.
   */
  precision?: number;
}

/**
 * The real data type has as its domain all rational, irrational and scientific real numbers. It is
 * a specialization of the number data type.
 * @see ISO-10303-11:2004 section 8.1.2 Real data type
 */
class RealType extends SimpleType<number> {
  private _precision?: number;
  /**
   * Initializes a new instance of the RealType class.
   * @param props The properties of the real data type. The properties are:
   * - value: The value of the real data type originating from a literal JavaScript value.
   * - precision: The precision of the real value.
   */
  constructor(props: RealTypeProps) {
    super(props);
    this._precision = props?.precision;
    this.validate();
    if (this._precision !== undefined) {
      this._value = Number(this._value.toFixed(this._precision));
    }
  }

  /**
   * Returns the precision of the real value.
   */
  public get precision(): number | undefined {
    return this._precision;
  }

  /**
   * Sets the precision of the real value.
   * @param value The precision of the real value.
   */
  public set precision(value: number | undefined) {
    this._precision = value;
    this.validate();
  }

  /**
   * This function returns a function for parsing a number to an instance of RealType.
   * @param props The properties of the real data type. The properties are:
   * - precision: The precision of the real value.
   * @returns A function for parsing a number.
   */
  public static parse(props?: { precision?: number }) {
    /**
     * This function parses a number to an instance of RealType.
     * @param value The number value to be parsed.
     */
    return (value: number) =>
      new RealType({ value, precision: props?.precision });
  }

  protected validate(): void {
    if (!isValidNumber(this._value)) {
      throw new InvalidDataTypeException(this._value, RealType.name);
    }
    const precision = this._precision;
    if (precision !== undefined) {
      if (!isValidRealPrecision(precision)) {
        throw new SimpleTypeRealPrecisionNotAllowedException(precision);
      }
    }
  }
}

export default RealType;
