import VariableSizeAggregationType, {
  VariableSizeAggregationTypeProps
} from './variable-size-aggregation-type';

/**
 * Represents the properties of the set data type.
 */
export interface SetTypeProps<T> extends VariableSizeAggregationTypeProps<T> {}

/**
 * A set data type has as its domain unordered collections of like elements. The set data type is
 * a specialization of the bag data type. The optional lower and upper bounds, which are integer-valued
 * expressions, define the minimum and maximum number of elements that can be held in
 * the collection defined by a set data type. The collection defined by set data type shall not
 * contain two or more elements which are instance equal.
 * @see ISO-10303-11:2004 section 8.2.4 Set data type
 */
class SetType<T> extends VariableSizeAggregationType<T> {
  /**
   * Initializes a new instance of the set data type.
   * @param props The properties of the set data type.
   * - values: The values of the set data type.
   * - lowerIndex: The lower bound of the set data type.
   * - upperIndex: The upper bound of the set data type.
   */
  constructor(props: SetTypeProps<T>) {
    super(props);
    this.validate();
  }

  // /**
  //  * This function returns a function for parsing a set to an instance of SetType.
  //  * @param parser The parser for the items.
  //  * @param options Options for parsing the set. The options are:
  //  * - lowerBound: The lower bound of the set.
  //  * - upperBound: The upper bound of the set.
  //  * @returns A function for parsing a set.
  //  */
  // public static parse<T>(
  //   parser: (value: T) => any,
  //   options?: { lowerBound?: number; upperBound?: number }
  // ) {
  //   /**
  //    * This function parses a set to an instance of SetType.
  //    * @param items The items to be parsed.
  //    */
  //   return (items: T[]) =>
  //     new SetType<T>(
  //       items.map((item) => parser(item)),
  //       options?.lowerBound,
  //       options?.upperBound
  //     );
  // }

  protected override validate(): void {
    this._values = [...new Set(this._values)];
    super.validate();
  }
}

export default SetType;
