import { InvalidDataTypeException } from '../exceptions';

/**
 * An enumeration data type has as its domain a set of names. The extent of this set of names
 * is determined depending on the type of enumeration data type.
 * @see ISO-10303-11:2004 8.4.1 Enumeration data type
 */
export class STPEnum<T extends string> {
  private _value: Uppercase<T>;

  /**
   * Initialize a new instance of STPEnum.
   * @param value The value of the enumeration data type.
   */
  constructor(value: Uppercase<T>) {
    this._value = value;
    this.validate();
  }

  get value(): Uppercase<T> {
    return this._value;
  }

  set value(value: Uppercase<T>) {
    this._value = value;
  }

  protected validate(): void {
    if (this._value !== this._value.toUpperCase()) {
      throw new InvalidDataTypeException(this._value, STPEnum.name);
    }
  }
}
