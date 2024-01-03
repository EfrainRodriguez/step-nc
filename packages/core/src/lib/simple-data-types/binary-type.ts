import SimpleType from './simple-type';
import {
  InvalidDataTypeException,
  SimpleTypeInvalidExpectedStringWidthException,
  SimpleTypeStringWidthNotAllowedException
} from '../exceptions';
import { isValidStringMaxLength } from '../utils';

/**
 * Represents the properties of the binary data type.
 */
export interface BinaryTypeProps {
  /**
   * The value of the binary data type originating from a literal JavaScript value.
   */
  value: string;
  /**
   * The length of the binary value.
   */
  width?: number;
  /**
   * Indicates whether the binary is fixedWidth length.
   */
  fixedWidth?: boolean;
}

/**
 * The binary data type has as its domain sequences of bits, each bit being represented by 0 or 1.
 * @see ISO-10303-11:2004 section 8.1.7 Binary data type
 */
class BinaryType extends SimpleType<string> {
  protected _width?: number;
  protected _fixedWidth?: boolean;

  /**
   * Initializes a new instance of the BinaryType class.
   * @param props The properties of the binary data type. The properties are:
   * - value: The value of the binary data type originating from a literal JavaScript value.
   * - width: The length of the binary value.
   * - fixedWidth: Indicates whether the binary is fixedWidth length.
   */
  constructor(props: BinaryTypeProps) {
    super(props);
    this._width = props?.width;
    this._fixedWidth = props?.fixedWidth;
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
   * Converts a hexadecimal string to a BinaryType object.
   * @param props The properties of the binary data type. The properties are:
   * - value: The value of the binary data type originating from a literal JavaScript value.
   * - width: The maximum length of the binary value.
   * - fixedWidth: Indicates whether the binary is fixedWidth length.
   * @returns A string that represents the current BinaryType object.
   */
  static fromHex(props: BinaryTypeProps): BinaryType {
    if (!/^[0-9A-Fa-f]+$/.test(props?.value)) {
      throw new InvalidDataTypeException(props?.value, BinaryType.name);
    }
    let width = props?.width;
    if (width === undefined) {
      width = props?.value?.length * 4;
    }
    return new BinaryType({
      value: props?.value
        .split('')
        .map((bit) => parseInt(bit, 16).toString(2).padStart(4, '0'))
        .join(''),
      width: width,
      fixedWidth: props?.fixedWidth
    });
  }

  /**
   * This function returns a function for parsing a string to an instance of BinaryType.
   * @param options Options for parsing the string. The options are:
   * - maxLength: The maximum length of the string.
   * @returns A function for parsing a string to an instance of BinaryType.
   */
  public static parse(options?: { maxLength?: number }) {
    /**
     * This function parses a string to an instance of BinaryType.
     * @param value The string value to be parsed.
     */
    return (value: string) =>
      new BinaryType({ value, width: options?.maxLength });
  }

  protected validate(): void {
    if (typeof this._value !== 'string') {
      throw new InvalidDataTypeException(this._value, BinaryType.name);
    }
    if (!/^(%|0b)?[01]+$/.test(this._value)) {
      throw new InvalidDataTypeException(this._value, BinaryType.name);
    }
    if (this._width !== undefined) {
      if (!isValidStringMaxLength(this._width)) {
        throw new SimpleTypeStringWidthNotAllowedException(this._width);
      }
      if (this._fixedWidth) {
        if (this._value.length !== this._width) {
          throw new SimpleTypeInvalidExpectedStringWidthException(
            this._value,
            this._width,
            BinaryType.name
          );
        }
      } else {
        if (this._value.length > this._width) {
          throw new SimpleTypeInvalidExpectedStringWidthException(
            this._value,
            this._width,
            BinaryType.name
          );
        }
      }
    }
  }
}

export default BinaryType;
