/**
 * This interface represents the properties of an aggregation data type.
 * - values: The values of the aggregation data type.
 */
export interface AggregationTypeProps<T> {
  values?: T[];
}

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
 * @see ISO-10303-11:2004 section 8.2 Aggregation data types
 */
abstract class AggregationType<T> {
  protected _values: T[];
  protected readonly _size: number;

  /**
   * Creates an instance of aggregation.
   * @param props The properties of the aggregation data type. The properties are:
   * - values: The values of the aggregation data type.
   */
  constructor(props: AggregationTypeProps<T>) {
    this._values = props?.values ?? [];
    this._size = this._values.length;
  }

  /**
   * Returns the number of values in the aggregation.
   */
  public get size(): number {
    return this._size;
  }

  /**
   * Clears the aggregation.
   */
  public clear(): void {
    this._values = [];
  }

  /**
   * Adds an value to the aggregation.
   * @param value The value to add.
   */
  public add(value: T): void {
    this._values.push(value);
    this.validate();
  }

  /**
   * Returns the specified value in the aggregation.
   * @param value The value to get.
   */
  public get(value: T): T | undefined {
    return this._values.find((i) => i === value);
  }

  /**
   * Removes the specified value from the aggregation.
   * @param value The value to remove.
   */
  public remove(value: T): void {
    const index = this._values.indexOf(value);
    if (index > -1) {
      this._values.splice(index, 1);
    }
    this.validate();
  }

  /**
   * Returns true if the aggregation contains the specified value.
   * @param value The value to check.
   */
  public has(value: T): boolean {
    return this._values.includes(value);
  }

  /**
   * Iterates over the values of the aggregation.
   */
  public forEach(
    callbackfn: (value: T, index: number, array: T[]) => void
  ): void {
    this._values.forEach(callbackfn);
  }

  /**
   * Returns the values of the aggregation.
   */
  public getValues(): T[] {
    return this._values;
  }

  /**
   * Sets the values of the aggregation.
   * @param values The values to set.
   */
  public setValues(values: T[]): void {
    this._values = values;
    this.validate();
  }

  protected abstract validate(): void;
}

export default AggregationType;
