import { OrderedAggregation } from './ordered-aggregation';
import {
  AggregationBelowLowerBoundException,
  AggregationExceededUpperBoundException,
  AggregationInvalidBoundException
} from '../exceptions';
import {
  isValidAggregationLowerBound,
  isValidAggregationUpperBound
} from '../utils';

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

  /**
   * This function returns a function for parsing a list to an instance of STPList.
   * @param parser The parser for the items.
   * @param options Options for parsing the list. The options are:
   * - lowerBound: The lower bound of the list.
   * - upperBound: The upper bound of the list.
   * - unique: Indicates whether the list can contain duplicate elements.
   * @returns A function for parsing a list.
   */
  public static parse<T>(
    parser: (value: T) => any,
    options?: { lowerBound?: number; upperBound?: number; unique?: boolean }
  ) {
    /**
     * This function parses a list to an instance of STPList.
     * @param items The items to be parsed.
     */
    return (items: T[]) =>
      new STPList<T>(
        items.map((item) => parser(item)),
        options?.lowerBound,
        options?.upperBound,
        options?.unique
      );
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
      if (!isValidAggregationUpperBound(this._upperBound)) {
        throw new AggregationInvalidBoundException(this._upperBound, false);
      }
      if (this._items.length > this._upperBound) {
        throw new AggregationExceededUpperBoundException(this._upperBound);
      }
    }
  }
}
