import { Aggregation } from './aggregation';

export abstract class UnorderedAggregation<T> extends Aggregation<T> {
  protected _lowerBound?: number;
  protected _upperBound?: number;

  constructor(items: T[] = [], lowerBound?: number, upperBound?: number) {
    super(items);
    this._lowerBound = lowerBound;
    this._upperBound = upperBound;
  }

  /**
   * Returns the lower bound of the unordered aggregation.
   */
  public get lowerBound(): number | undefined {
    return this._lowerBound;
  }

  /**
   * Sets the lower bound of the unordered aggregation.
   * @param lowerBound The lower bound of the unordered aggregation.
   */
  public set lowerBound(lowerBound: number | undefined) {
    this._lowerBound = lowerBound;
    this.validate();
  }

  /**
   * Returns the upper bound of the unordered aggregation.
   */
  public get upperBound(): number | undefined {
    return this._upperBound;
  }

  /**
   * Sets the upper bound of the unordered aggregation.
   * @param upperBound The upper bound of the unordered aggregation.
   */
  public set upperBound(upperBound: number | undefined) {
    this._upperBound = upperBound;
    this.validate();
  }
}
