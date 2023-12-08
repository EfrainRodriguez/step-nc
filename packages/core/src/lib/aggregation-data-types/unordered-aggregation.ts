import { Aggregation } from './aggregation';

export abstract class UnorderedAggregation<T> extends Aggregation<T> {
  protected _lowerBound?: number;
  protected _upperBound?: number;

  constructor(items: T[] = [], lowerBound?: number, upperBound?: number) {
    super(items);
    this._lowerBound = lowerBound;
    this._upperBound = upperBound;
  }

  public get lowerBound(): number | undefined {
    return this._lowerBound;
  }

  public set lowerBound(lowerBound: number | undefined) {
    this._lowerBound = lowerBound;
    this.validate();
  }

  public get upperBound(): number | undefined {
    return this._upperBound;
  }

  public set upperBound(upperBound: number | undefined) {
    this._upperBound = upperBound;
    this.validate();
  }
}
