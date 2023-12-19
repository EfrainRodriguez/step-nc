import SimpleType from './simple-type';
import {
  InvalidDataTypeException,
  SimpleTypeInvalidExpectedStringWidthException,
  SimpleTypeStringWidthNotAllowedException
} from '../exceptions';
import { isValidStringMaxLength } from '../utils';

/**
 * Represents the properties of the string data type.
 */
export interface StringTypeProps {
  /**
   * The value of the string data type originating from a literal JavaScript value.
   */
  value: string;
  /**
   * The length of the string.
   */
  width?: number;
  /**
   * Indicates whether the string is fixedWidth length.
   */
  fixedWidth?: boolean;
  /**
   * Indicates whether the string is encoded.
   */
  encoded?: boolean;
}

/**
 * The string data type has as its domain sequences of characters. The characters that are
 * permitted as part of a string value are those characters allocated to cells 09, 0A, 0D and the
 * graphic characters lying in the ranges 20 to 7E and A0 to 10FFFE of ISO/IEC 10646.
 * @see ISO-10303-11:2004 section 8.1.6 String data type
 */
class StringType extends SimpleType<string> {
  protected _width?: number;
  protected _fixedWidth?: boolean;
  protected _encoded?: boolean;

  /**
   * Initializes a new instance of the StringType class.
   * @param props The properties of the string data type. The properties are:
   * - value: The value of the string data type originating from a literal JavaScript value.
   * - width: The length of the string.
   * - fixedWidth: Indicates whether the string is fixedWidth length.
   * - encoded: Indicates whether the string is encoded.
   */
  constructor(props: StringTypeProps) {
    super(props);
    this._width = props?.width;
    this._fixedWidth = props?.fixedWidth ?? false;
    this._encoded = props?.encoded ?? false;
    this.validate();
  }

  /**
   * Returns the length of the string.
   */
  public get width(): number | undefined {
    return this._width;
  }

  /**
   * Sets the length of the string.
   * @param value The length of the string.
   */
  public set width(value: number | undefined) {
    this._width = value;
    this.validate();
  }

  /**
   * Returns whether the string is fixedWidth length.
   */
  public get fixedWidth(): boolean | undefined {
    return this._fixedWidth;
  }

  /**
   * Sets whether the string is fixedWidth length.
   * @param value Indicates whether the string is fixedWidth length.
   */
  public set fixedWidth(value: boolean | undefined) {
    this._fixedWidth = value;
    this.validate();
  }

  /**
   * Returns whether the string is encoded.
   */
  public get encoded(): boolean | undefined {
    return this._encoded;
  }

  /**
   * Sets whether the string is encoded.
   * @param value Indicates whether the string is encoded.
   */
  public set encoded(value: boolean | undefined) {
    this._encoded = value;
    this.validate();
  }

  /**
   * This function returns a function for parsing a string to an instance of StringType.
   * @param options Options for parsing the string. The options are:
   * - maxLength: The maximum length of the string.
   * @returns A function for parsing a string.
   */
  public static parse(options?: { maxLength?: number }) {
    /**
     * This function parses a string to an instance of StringType.
     * @param value The string value to be parsed.
     */
    return (value: string) => new StringType({ value, ...options });
  }

  protected validate(): void {
    if (typeof this._value !== 'string') {
      throw new InvalidDataTypeException(this._value, StringType.name);
    }
    if (this._width !== undefined) {
      if (!isValidStringMaxLength(this._width)) {
        throw new SimpleTypeStringWidthNotAllowedException(this._width);
      }
      if (this._encoded) {
        this._width = this._width * 8;
      }
      if (this._fixedWidth) {
        if (this._value.length !== this._width) {
          throw new SimpleTypeInvalidExpectedStringWidthException(
            this._value,
            this._width,
            StringType.name
          );
        }
      } else {
        if (this._value.length > this._width) {
          throw new SimpleTypeInvalidExpectedStringWidthException(
            this._value,
            this._width,
            StringType.name
          );
        }
      }
    }
    if (this._encoded) {
      if (!/^([0-9a-fA-F]{8} ?)*[0-9a-fA-F]{8}?$/.test(this._value)) {
        throw new InvalidDataTypeException(this._value, StringType.name);
      }
    }
  }
}

export default StringType;
