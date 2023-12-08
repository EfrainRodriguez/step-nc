import { Aggregation } from './aggregation';

export abstract class OrderedAggregation<T> extends Aggregation<T> {
  protected _lowerBound: number;
  protected _upperBound: number;
  protected _unique: boolean;

  constructor(
    items: T[] = [],
    lowerBound: number,
    upperBound: number,
    unique: boolean = false
  ) {
    super(items);
    this._lowerBound = lowerBound;
    this._upperBound = upperBound;
    this._unique = unique;
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

  public insertAt(index: number, item: T): void {
    this._items.splice(index, 0, item);
    this.validate();
  }

  public removeAt(index: number): void {
    this._items.splice(index, 1);
    this.validate();
  }

  public getAt(index: number): T {
    return this._items[index];
  }
}
