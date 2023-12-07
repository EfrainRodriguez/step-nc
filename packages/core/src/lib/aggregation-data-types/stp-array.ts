import { OrderedAggregation } from './ordered-aggregation';
import {
  AggregationBelowLowerBoundException,
  AggregationExceededUpperBoundException,
  AggregationInvalidBoundException
} from '../exceptions';
import {
  isValidAggregationLowerBound,
  isValidAggregationUpperBound
} from '../utils/validations.utils';

/**
 * An array data type has as its domain indexed, fixed-size collections of like elements. The lower
 * and upper bounds, which are integer-valued expressions, define the range of index values, and
 * thus the size of each array collection. An array data type definition may optionally specify
 * that an array value cannot contain duplicate elements. It may also specify that an array value
 * need not contain an element at every index position.
 * @see ISO-10303-11:2004 8.2.1 Array data type
 */
export class STPArray<T> extends OrderedAggregation<T> {
  private _lowerBound: number;
  private _upperBound: number;
  private _unique: boolean;
  private _optional: boolean;

  /**
   * Initializes a new instance of the array data type.
   * @param items The items.
   * @param lowerBound The lower bound.
   * @param upperBound The upper bound.
   * @param unique Indicates whether the array can contain duplicate elements.
   * @param optional Indicates whether the array can contain empty elements.
   */
  constructor(
    items: T[] = [],
    lowerBound: number,
    upperBound: number,
    unique: boolean = false,
    optional: boolean = false
  ) {
    super(items);
    this._lowerBound = lowerBound;
    this._upperBound = upperBound;
    this._unique = unique;
    this._optional = optional;
    this.validate();
  }

  public get lowerBound(): number {
    return this._lowerBound;
  }

  public set lowerBound(lowerBound: number) {
    this._lowerBound = lowerBound;
    this.validate();
  }

  public get upperBound(): number {
    return this._upperBound;
  }

  public set upperBound(upperBound: number) {
    this._upperBound = upperBound;
    this.validate();
  }

  public get unique(): boolean {
    return this._unique;
  }

  public set unique(unique: boolean) {
    this._unique = unique;
    this.validate();
  }

  public get optional(): boolean {
    return this._optional;
  }

  public set optional(optional: boolean) {
    this._optional = optional;
    this.validate();
  }

  protected validate(): void {
    if (this._unique) {
      this._items = [...new Set(this._items)];
    }
    if (this._optional) {
      this._items = this._items.filter((item) => item !== undefined);
    }
    if (!isValidAggregationLowerBound(this._lowerBound)) {
      throw new AggregationInvalidBoundException(this._lowerBound, true);
    }
    if (!isValidAggregationUpperBound(this._upperBound)) {
      throw new AggregationInvalidBoundException(this._upperBound, false);
    }
    if (this._items.length < this._lowerBound) {
      throw new AggregationBelowLowerBoundException(this._lowerBound);
    }
    if (this._items.length > this._upperBound) {
      throw new AggregationExceededUpperBoundException(this._upperBound);
    }
  }
}
