/**
 * This abstract class is used to represent the simple data types defined in ISO 10303-11.
 *
 * The simple data types define the domains of the atomic data units in EXPRESS. That is, they
 * cannot be further subdivided into elements that EXPRESS recognizes. The simple data types
 * are NUMBER, REAL, INTEGER, STRING, BOOLEAN, LOGICAL, and BINARY.
 *
 * @see ISO-10303-11:2004 8.1 Simple data types
 */
export abstract class SimpleData<T> {
  protected _value: T;

  /**
   * Initializes a new instance of the class SimpleData to represents a simple data type
   * in the STEP context.
   * @param value The value of the simple data type originating from the JavaScript world
   * including strings, numbers, booleans, and other basic JavaScript types.
   */
  constructor(value: T) {
    this._value = value;
    this.validate();
  }

  public get value(): T {
    return this._value;
  }

  public set value(value: T) {
    this._value = value;
    this.validate();
  }

  protected abstract validate(): void;
}
