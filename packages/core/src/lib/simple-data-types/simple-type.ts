/**
 * Represents the properties of a simple data type.
 */
export interface SimpleTypeProps<T> {
  /**
   * The value of the simple data type originating from a literal JavaScript value.
   */
  value: T;
}

/**
 * This abstract class is used to represent the simple data types defined in ISO 10303-11.
 *
 * The simple data types define the domains of the atomic data units in EXPRESS. That is, they
 * cannot be further subdivided into elements that EXPRESS recognizes. The simple data types
 * are NUMBER, REAL, INTEGER, STRING, BOOLEAN, LOGICAL, and BINARY.
 *
 * @see ISO-10303-11:2004 section 8.1 Simple data types
 */
abstract class SimpleType<T> {
  protected _value: T;

  /**
   * Initializes a new instance of the class SimpleType to represents a simple data type
   * in the STEP context.
   * @param props The properties of the simple data type. The properties are:
   * - value: The value of the simple data type originating from a literal JavaScript value. 
   */
  constructor(props: SimpleTypeProps<T>) {
    this._value = props?.value;
  }

  /**
   * Returns the value of the simple data type.
   */
  public get value(): T {
    return this._value;
  }

  /**
   * Sets the value of the simple data type.
   * @param value The value of the simple data type originating from a literal JavaScript value.
   */
  public set value(value: T) {
    this._value = value;
  }

  protected abstract validate(): void;
}

export default SimpleType;
