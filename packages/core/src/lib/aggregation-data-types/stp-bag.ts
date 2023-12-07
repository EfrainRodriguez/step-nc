import { UnorderedAggregation } from './unordered-aggregation';
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
 * A bag data type has as its domain unordered collections of like elements. The optional lower
 * and upper bounds, which are integer-valued expressions, define the minimum and maximum
 * number of elements that can be held in the collection defined by a bag data type.
 * @see ISO-10303-11:2004 8.2.3 Bag data type
 */
export class STPBag<T> extends UnorderedAggregation<T> {
  /**
   * Initializes a new instance of the bag data type.
   * @param items The items.
   * @param lowerBound The lower bound.
   * @param upperBound The upper bound.
   */
  constructor(items: T[] = [], lowerBound?: number, upperBound?: number) {
    super(items, lowerBound, upperBound);
    this.validate();
  }

  protected validate(): void {
    if (this._lowerBound !== undefined) {
      if (!isValidAggregationLowerBound(this._lowerBound)) {
        throw new AggregationInvalidBoundException(this._lowerBound, true);
      }
      if (this._items.length < this._lowerBound) {
        throw new AggregationBelowLowerBoundException(this._lowerBound);
      }
    }
    if (this._upperBound !== undefined) {
      if (!isValidAggregationUpperBound(this._upperBound)) {
        throw new AggregationInvalidBoundException(this._upperBound, false);
      }
      if (this._items.length > this._upperBound) {
        throw new AggregationExceededUpperBoundException(this._upperBound);
      }
    }
  }
}
