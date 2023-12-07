/**
 * This abstract class is used to represent the aggregation data types defined in ISO 10303-11.
 *
 * Aggregation data types have as their domains collections of values of a given base data type (see
 * 8.6.1). These base data type values are called elements of the aggregation collection. EXPRESS
 * provides for the definition of four kinds of aggregation data types: array, list, bag, and set.
 * Each kind of aggregation data type attaches different properties to its values. The aggregate
 * data type is the generalization of these four aggregation data types (see 9.5.3.1).
 *
 * — An array is a fixed-size ordered collection. It is indexed by a sequence of integers.
 * EXAMPLE 1 A transformation matrix (for geometry) may be defined as an array of arrays (of
 * numbers).
 *
 * — A list is a sequence of elements which can be accessed according to their position. The
 * number of elements in a list may vary, and can be constrained by the definition of the data
 * type.
 * EXAMPLE 2 The operations of a process plan might be represented as a list. The operations are
 * ordered, and operations can be added to or removed from a process plan.
 *
 * — A bag is an unordered collection in which duplication is allowed. The number of elements
 * in a bag may vary, and can be constrained by the definition of the data type.
 * EXAMPLE 3 The collection of fasteners used in an assembly problem could be represented as a
 * bag. There might be a number of elements which are equivalent bolts, but which one is used in a
 * particular hole is unimportant.
 *
 * — A set is an unordered collection of elements in which no two elements are instance equal.
 * The number of elements in a set may vary, and can be constrained by the definition of the
 * data type.
 * EXAMPLE 4 The population of people in this world is a set.
 *
 * NOTE EXPRESS aggregations are one dimensional. Objects usually considered to have multiple
 * dimensions (such as mathematical matrices) can be represented by an aggregation data type whose base
 * type is another aggregation data type. Aggregation data types can be thus nested to an arbitrary depth,
 * allowing any number of dimensions to be represented.
 * EXAMPLE 5 One could define a LIST[1:3] OF ARRAY[5:10] OF INTEGER, which would in effect have
 * two dimensions
 *
 * @see ISO-10303-11:2004 8.2 Aggregation data types
 */
export abstract class Aggregation<T> {
  protected _items: T[];
  protected readonly _size: number;

  constructor(items: T[] = []) {
    this._items = items;
    this._size = this._items.length;
  }

  public get size(): number {
    return this._size;
  }

  public clear(): void {
    this._items = [];
  }

  public add(item: T): void {
    this._items.push(item);
    this.validate();
  }

  public remove(item: T): void {
    const index = this._items.indexOf(item);
    if (index > -1) {
      this._items.splice(index, 1);
    }
    this.validate();
  }

  public has(item: T): boolean {
    return this._items.includes(item);
  }

  public forEach(
    callbackfn: (value: T, index: number, array: T[]) => void
  ): void {
    this._items.forEach(callbackfn);
  }

  public getItems(): T[] {
    return this._items;
  }

  public setItems(items: T[]): void {
    this._items = items;
    this.validate();
  }

  protected abstract validate(): void;
}
