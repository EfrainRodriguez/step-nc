import VariableSizeAggregationType, {
  VariableSizeAggregationTypeProps
} from './variable-size-aggregation-type';
import { AggregationTypeOutOfBoundsException } from '../exceptions';

/**
 * The properties of the list data type.
 */
export interface ListTypeProps<T> extends VariableSizeAggregationTypeProps<T> {
  /**
   * Indicates whether the list can contain duplicate elements.
   */
  uniqueFlag?: boolean;
}

/**
 * A list data type has as its domain sequences of like elements. The optional lower and upper
 * bounds, which are integer-valued expressions, define the minimum and maximum number of
 * elements that can be held in the collection defined by a list data type. A list data type
 * definition may optionally specify that a list value cannot contain duplicate elements.
 * @see ISO-10303-11:2004 section 8.2.2 List data type
 */
class ListType<T> extends VariableSizeAggregationType<T> {
  protected _uniqueFlag?: boolean;

  /**
   * Initializes a new instance of the list data type.
   * @param props The properties of the list data type.
   * - values: The values of the list data type.
   * - lowerIndex: The lower bound of the list data type.
   * - upperIndex: The upper bound of the list data type.
   * - uniqueFlag: Indicates whether the list can contain duplicate elements.
   */
  constructor(props: ListTypeProps<T>) {
    super(props);
    this._uniqueFlag = props?.uniqueFlag;
    this.validate();
  }

  /**
   * Returns the unique flag of the list data type.
   */
  public get uniqueFlag(): boolean | undefined {
    return this._uniqueFlag;
  }

  /**
   * Sets the unique flag of the list data type.
   * @param value The unique flag to set.
   */
  public set uniqueFlag(value: boolean | undefined) {
    this._uniqueFlag = value;
    this.validate();
  }

  /**
   * Inserts an value at the specified index.
   * @param index The index to insert the value at.
   * @param value The value to insert.
   */
  public insertAt(index: number, value: T): void {
    this.validateOfBounds(index);
    this._values.splice(index, 0, value);
    this.validate();
  }

  /**
   * Removes the value at the specified index.
   * @param index The index to remove the value at.
   */
  public removeAt(index: number): void {
    this.validateOfBounds(index);
    this._values.splice(index, 1);
    this.validate();
  }

  /**
   * Returns the value at the specified index.
   * @param index The index to get the value at.
   */
  public getAt(index: number): T {
    this.validateOfBounds(index);
    return this._values[index];
  }

  // /**
  //  * This function returns a function for parsing a list to an instance of ListType.
  //  * @param parser The parser for the items.
  //  * @param options Options for parsing the list. The options are:
  //  * - lowerBound: The lower bound of the list.
  //  * - upperBound: The upper bound of the list.
  //  * - unique: Indicates whether the list can contain duplicate elements.
  //  * @returns A function for parsing a list.
  //  */
  // public static parse<T>(
  //   parser: (value: T) => any,
  //   options?: { lowerBound?: number; upperBound?: number; unique?: boolean }
  // ) {
  //   /**
  //    * This function parses a list to an instance of ListType.
  //    * @param items The items to be parsed.
  //    */
  //   return (items: T[]) =>
  //     new ListType<T>(
  //       items.map((item) => parser(item)),
  //       options?.lowerBound,
  //       options?.upperBound,
  //       options?.unique
  //     );
  // }

  private validateOfBounds(index: number): void {
    if (index < 0 || index >= this._values.length) {
      throw new AggregationTypeOutOfBoundsException(index);
    }
  }

  protected override validate(): void {
    if (this._uniqueFlag) {
      this._values = [...new Set(this._values)];
    }
    super.validate();
  }
}

export default ListType;
