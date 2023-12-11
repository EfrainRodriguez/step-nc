import { Entity } from '../named-data-types';
import { InvalidDataTypeException } from '../exceptions';

/**
 * A select data type defines a data type that enables a choice among several named data types.
 * The select data type is a generalization of these named data types in its domain. The defined
 * type for which the select data type is the underlying representation, may add constraints on
 * its domain by declaring local rules. A select data type may be extensible or not.
 */
export class STPSelect<T extends Entity> {
  private _value: T;

  /**
   * Initialize a new instance of STPSelect.
   * @param value The value of the select data type.
   */
  constructor(value: T) {
    this._value = value;
    this.validate();
  }

  /**
   * Returns the value of the select data type.
   */
  get value(): T {
    return this._value;
  }

  /**
   * Sets the value of the select data type.
   */
  set value(value: T) {
    this._value = value;
  }

  protected validate(): void {
    if (!(this._value instanceof Entity)) {
      throw new InvalidDataTypeException(this._value, STPSelect.name);
    }
  }
}
