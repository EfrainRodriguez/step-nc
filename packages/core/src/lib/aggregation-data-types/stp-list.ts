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
 * A list data type has as its domain sequences of like elements. The optional lower and upper
 * bounds, which are integer-valued expressions, define the minimum and maximum number of
 * elements that can be held in the collection defined by a list data type. A list data type
 * definition may optionally specify that a list value cannot contain duplicate elements.
 * @see ISO-10303-11:2004 8.2.2 List data type
 */
export class STPList<T> extends OrderedAggregation<T> {
  /**
   * Initializes a new instance of the list data type.
   * @param items The items.
   * @param lowerBound The lower bound.
   * @param upperBound The upper bound.
   * @param unique Indicates whether the list can contain duplicate elements.
   */
  constructor(
    items: T[] = [],
    lowerBound: number = undefined as unknown as number,
    upperBound: number = undefined as unknown as number,
    unique: boolean = false
  ) {
    super(items, lowerBound, upperBound, unique);
    this.validate();
  }

  protected validate(): void {
    if (this._unique) {
      this._items = [...new Set(this._items)];
    }
    if (this._lowerBound !== undefined) {
      if (!isValidAggregationLowerBound(this._lowerBound)) {
        throw new AggregationInvalidBoundException(this._lowerBound, true);
      }
      if (this._items.length < this._lowerBound) {
        throw new AggregationBelowLowerBoundException(this._lowerBound);
      }
    }
    if (this._upperBound !== undefined) {
      console.log('upper', this._upperBound);
      if (!isValidAggregationUpperBound(this._upperBound)) {
        throw new AggregationInvalidBoundException(this._upperBound, false);
      }
      if (this._items.length > this._upperBound) {
        throw new AggregationExceededUpperBoundException(this._upperBound);
      }
    }
  }
}
