import { Aggregation } from './aggregation';

export abstract class OrderedAggregation<T> extends Aggregation<T> {
  protected _lowerBound: number;
  protected _upperBound: number;
  protected _unique: boolean;

  /**
   * Creates an instance of ordered aggregation.
   * @param items The items of the ordered aggregation.
   * @param lowerBound The lower bound of the ordered aggregation.
   * @param upperBound The upper bound of the ordered aggregation.
   * @param unique True if the ordered aggregation is unique.
   */
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

  /**
   * Returns the lower bound of the ordered aggregation.
   */
  public get lowerBound(): number {
    return this._lowerBound;
  }

  /**
   * Sets the lower bound of the ordered aggregation.
   * @param lowerBound The lower bound of the ordered aggregation.
   */
  public set lowerBound(lowerBound: number) {
    this._lowerBound = lowerBound;
    this.validate();
  }

  /**
   * Returns the upper bound of the ordered aggregation.
   */
  public get upperBound(): number {
    return this._upperBound;
  }

  /**
   * Sets the upper bound of the ordered aggregation.
   * @param upperBound The upper bound of the ordered aggregation.
   */
  public set upperBound(upperBound: number) {
    this._upperBound = upperBound;
    this.validate();
  }

  /**
   * Returns true if the ordered aggregation is unique.
   */
  public get unique(): boolean {
    return this._unique;
  }

  /**
   * Sets true if the ordered aggregation is unique.
   * @param unique True if the ordered aggregation is unique.
   */
  public set unique(unique: boolean) {
    this._unique = unique;
    this.validate();
  }

  /**
   * Inserts an item at the specified index.
   * @param index The index to insert the item at.
   * @param item The item to insert.
   */
  public insertAt(index: number, item: T): void {
    this._items.splice(index, 0, item);
    this.validate();
  }

  /**
   * Removes the item at the specified index.
   * @param index The index to remove the item at.
   */
  public removeAt(index: number): void {
    this._items.splice(index, 1);
    this.validate();
  }

  /**
   * Returns the item at the specified index.
   * @param index The index to get the item at.
   */
  public getAt(index: number): T {
    return this._items[index];
  }
}
