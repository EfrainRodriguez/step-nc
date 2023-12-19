import AggregationType, { AggregationTypeProps } from './aggregation-type';
import {
  AggregationTypeLowerIndexMustBeLessThanUpperIndexException,
  AggregationTypeInvalidBoundException,
  AggregationTypeOutOfBoundsException
} from '../exceptions';
import { isValidAggregationIndex } from '../utils';

/**
 * The properties of the array data type.
 */
export interface ArrayTypeProps<T> extends AggregationTypeProps<T> {
  /**
   * The lower bound of the array.
   */
  lowerIndex: number;
  /**
   * The upper bound of the array.
   */
  upperIndex: number;
  /**
   * Indicates whether the array can contain duplicate elements.
   */
  uniqueFlag: boolean;
  /**
   * Indicates whether the array can contain empty elements.
   */
  optionalFlag: boolean;
}

/**
 * An array data type has as its domain indexed, fixed-size collections of like elements. The lower
 * and upper bounds, which are integer-valued expressions, define the range of index values, and
 * thus the size of each array collection. An array data type definition may optionalFlagly specify
 * that an array value cannot contain duplicate elements. It may also specify that an array value
 * need not contain an element at every index position.
 * @see ISO-10303-11:2004 section 8.2.1 Array data type
 */
class ArrayType<T> extends AggregationType<T> {
  protected _lowerIndex: number;
  protected _upperIndex: number;
  protected _uniqueFlag = false;
  protected _optionalFlag = true;

  /**
   * Initializes a new instance of the array data type.
   * @param props The properties of the array data type.
   * - values: The values of the array.
   * - lowerIndex: The lower bound of the array.
   * - upperIndex: The upper bound of the array.
   * - uniqueFlag: Indicates whether the array can contain duplicate elements.
   * - optionalFlag: Indicates whether the array can contain empty elements.
   */
  constructor(props: ArrayTypeProps<T>) {
    super(props);
    this._lowerIndex = props?.lowerIndex;
    this._upperIndex = props?.upperIndex;
    this._uniqueFlag = props?.uniqueFlag;
    this._optionalFlag = props?.optionalFlag;
    this.validate();
  }

  /**
   * Returns the lower bound of the array.
   */
  public get lowerIndex(): number {
    return this._lowerIndex;
  }

  /**
   * Sets the lower bound of the array.
   * @param value The lower bound to set.
   */
  public set lowerIndex(value: number) {
    this._lowerIndex = value;
    this.validate();
  }

  /**
   * Returns the upper bound of the array.
   */
  public get upperIndex(): number {
    return this._upperIndex;
  }

  /**
   * Sets the upper bound of the array.
   * @param value The upper bound to set.
   */
  public set upperIndex(value: number) {
    this._upperIndex = value;
    this.validate();
  }

  /**
   * Returns the uniqueFlag of the array.
   */
  public get uniqueFlag(): boolean {
    return this._uniqueFlag;
  }

  /**
   * Sets the uniqueFlag of the array.
   * @param value The uniqueFlag to set.
   */
  public set uniqueFlag(value: boolean) {
    this._uniqueFlag = value;
    this.validate();
  }

  /**
   * Returns the optionalFlag of the array.
   */
  public get optionalFlag(): boolean {
    return this._optionalFlag;
  }

  /**
   * Sets the optionalFlag of the array.
   * @param value The optionalFlag to set.
   */
  public set optionalFlag(value: boolean) {
    this._optionalFlag = value;
    this.validate();
  }

  /**
   * Inserts an value at the specified index.
   * @param index The index to insert the value at.
   * @param value The value to insert.
   */
  public insertAt(index: number, value: T): void {
    this.validateOfBounds(index);
    this._values.splice(index, 0, value);
    this.validate();
  }

  /**
   * Removes the value at the specified index.
   * @param index The index to remove the value at.
   */
  public removeAt(index: number): void {
    this.validateOfBounds(index);
    this._values.splice(index, 1);
    this.validate();
  }

  /**
   * Returns the value at the specified index.
   * @param index The index to get the value at.
   */
  public getAt(index: number): T {
    this.validateOfBounds(index);
    return this._values[index];
  }

  // /**
  //  * This function returns a function for parsing an array to an instance of ArrayType.
  //  * @param parser A function for parsing an value to the type of the array.
  //  * @param options Options for parsing the array. The options are:
  //  * - lowerIndex: The lower bound of the array.
  //  * - upperIndex: The upper bound of the array.
  //  * - uniqueFlag: Indicates whether the array can contain duplicate elements.
  //  * - optionalFlag: Indicates whether the array can contain empty elements.
  //  * @returns A function for parsing an array.
  //  */
  // public static parse<T>(
  //   parser: (value: T) => any,
  //   options: {
  //     lowerIndex: number;
  //     upperIndex: number;
  //     uniqueFlag?: boolean;
  //     optionalFlag?: boolean;
  //   }
  // ) {
  //   /**
  //    * This function parses an array to an instance of ArrayType.
  //    * @param values The array to be parsed.
  //    */
  //   return (values: T[]) =>
  //     new ArrayType<T>(
  //       Object.assign(options, {
  //         values: values.map((value) => parser(value))
  //       })
  //     );
  // }

  private validateOfBounds(index: number): void {
    if (index < 0 || index >= this._values.length) {
      throw new AggregationTypeOutOfBoundsException(index);
    }
  }

  protected validate(): void {
    if (this._uniqueFlag) {
      this._values = [...new Set(this._values)];
    }
    if (!this._optionalFlag) {
      this._values = this._values.filter((value) => value !== undefined);
    }
    if (!isValidAggregationIndex(this._lowerIndex) || this._lowerIndex < 0) {
      throw new AggregationTypeInvalidBoundException(this._lowerIndex, true);
    }
    if (!isValidAggregationIndex(this._upperIndex) || this._upperIndex < 0) {
      throw new AggregationTypeInvalidBoundException(this._upperIndex, false);
    }
    if (this._lowerIndex > this._upperIndex) {
      throw new AggregationTypeLowerIndexMustBeLessThanUpperIndexException(
        this._lowerIndex,
        this._upperIndex
      );
    }
    if (this._values.length < this._lowerIndex) {
      throw new AggregationTypeInvalidBoundException(this._lowerIndex, true);
    }
    if (this._values.length > this._upperIndex) {
      throw new AggregationTypeInvalidBoundException(this._upperIndex, false);
    }
  }
}

export default ArrayType;
