import AggregationType, { AggregationTypeProps } from './aggregation-type';
import {
  AggregationTypeLowerIndexMustBeLessThanUpperIndexException,
  AggregationTypeInvalidBoundException
} from '../exceptions';
import { isValidAggregationIndex } from '../utils';

export interface VariableSizeAggregationTypeProps<T>
  extends AggregationTypeProps<T> {
  /**
   * The lower bound of the array.
   */
  lowerIndex?: number;
  /**
   * The upper bound of the array.
   */
  upperIndex?: number;
}

/**
 * This class represents collection with variable size.
 */
abstract class VariableSizeAggregationType<T> extends AggregationType<T> {
  protected _lowerIndex?: number;
  protected _upperIndex?: number;

  /**
   * Initializes a new instance of the class VariableSizeAggregationType.
   * @param props The properties of the variable size aggregation type.
   * - values: The values of the variable size aggregation type.
   * - lowerIndex: The lower bound of the variable size aggregation type.
   * - upperIndex: The upper bound of the variable size aggregation type.
   */
  constructor(props: VariableSizeAggregationTypeProps<T>) {
    super(props);
    this._lowerIndex = props?.lowerIndex;
    this._upperIndex = props?.upperIndex;
    this.validate();
  }

  /**
   * Returns the lower bound of the variable size aggregation type.
   */
  public get lowerIndex(): number | undefined {
    return this._lowerIndex;
  }

  /**
   * Sets the lower bound of the variable size aggregation type.
   * @param value The lower bound to set.
   */
  public set lowerIndex(value: number | undefined) {
    this._lowerIndex = value;
    this.validate();
  }

  /**
   * Returns the upper bound of the variable size aggregation type.
   */
  public get upperIndex(): number | undefined {
    return this._upperIndex;
  }

  /**
   * Sets the upper bound of the variable size aggregation type.
   * @param value The upper bound to set.
   */
  public set upperIndex(value: number | undefined) {
    this._upperIndex = value;
    this.validate();
  }

  protected validate(): void {
    if (this.lowerIndex !== undefined) {
      if (!isValidAggregationIndex(this.lowerIndex)) {
        throw new AggregationTypeInvalidBoundException(this.lowerIndex, true);
      }
    }

    if (this.upperIndex !== undefined) {
      if (!isValidAggregationIndex(this.upperIndex)) {
        throw new AggregationTypeInvalidBoundException(this.upperIndex, false);
      }
    }

    if (this.lowerIndex !== undefined && this.upperIndex !== undefined) {
      if (this.lowerIndex > this.upperIndex) {
        throw new AggregationTypeLowerIndexMustBeLessThanUpperIndexException(
          this.lowerIndex,
          this.upperIndex
        );
      }
    }
  }
}

export default VariableSizeAggregationType;
