import VariableSizeAggregationType, {
  VariableSizeAggregationTypeProps
} from './variable-size-aggregation-type';

export interface BagTypeProps<T> extends VariableSizeAggregationTypeProps<T> {}

/**
 * A bag data type has as its domain unordered collections of like elements. The optional lower
 * and upper bounds, which are integer-valued expressions, define the minimum and maximum
 * number of elements that can be held in the collection defined by a bag data type.
 * @see ISO-10303-11:2004 section 8.2.3 Bag data type
 */
class BagType<T> extends VariableSizeAggregationType<T> {
  /**
   * Initializes a new instance of the bag data type.
   * @param props The properties of the bag data type.
   * - values: The values of the bag data type.
   * - lowerIndex: The lower bound of the bag data type.
   * - upperIndex: The upper bound of the bag data type.
   */
  constructor(props: BagTypeProps<T>) {
    super(props);
    this.validate();
  }

  // /**
  //  * This function returns a function for parsing a bag to an instance of BagType.
  //  * @param parser The parser for the items.
  //  * @param options Options for parsing the bag. The options are:
  //  * - lowerBound: The lower bound of the bag.
  //  * - upperBound: The upper bound of the bag.
  //  * @returns A function for parsing a bag.
  //  */
  // public static parse<T>(
  //   parser: (value: T) => any,
  //   options?: { lowerBound?: number; upperBound?: number }
  // ) {
  //   /**
  //    * This function parses a bag to an instance of BagType.
  //    * @param items The items to be parsed.
  //    */
  //   return (items: T[]) =>
  //     new BagType<T>(
  //       items.map((item) => parser(item)),
  //       options?.lowerBound,
  //       options?.upperBound
  //     );
  // }
}

export default BagType;
