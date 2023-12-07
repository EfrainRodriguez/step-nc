import { Aggregation } from "./aggregation";

export abstract class OrderedAggregation<T> extends Aggregation<T> {
  public insertAt(index: number, item: T): void {
    this._items.splice(index, 0, item);
    this.validate();
  }

  public removeAt(index: number): void {
    this._items.splice(index, 1);
    this.validate();
  }
}