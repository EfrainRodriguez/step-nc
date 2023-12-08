import { SimpleData } from './simple-data';
import { SimpleDataInvalidValueException } from '../exceptions';

/**
 * The logical data type has as its domain the three types true, false, and unknown.
 * Here, undefined type is used to represent unknown.
 */
export type LogicalBase = boolean | undefined;

/**
 * The logical data type has as its domain the three literals true, false, and unknown.
 * Here, undefined type is used to represent unknown.
 * @see ISO-10303-11:2004 8.1.4 Logical data type
 */
export class STPLogical extends SimpleData<LogicalBase> {
  /**
   * Initializes a new instance of the logical data type.
   * @param value The value.
   */
  constructor(value: LogicalBase) {
    super(value);
    this.validate();
  }

  protected validate(): void {
    if (typeof this._value !== 'boolean' && this._value !== undefined) {
      throw new SimpleDataInvalidValueException(this._value, STPLogical.name);
    }
  }
}
