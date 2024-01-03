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
    if (this._lowerIndex !== undefined) {
      if (!isValidAggregationIndex(this._lowerIndex)) {
        throw new AggregationTypeInvalidBoundException(this._lowerIndex, true);
      }
    }

    if (this._upperIndex !== undefined) {
      if (!isValidAggregationIndex(this._upperIndex)) {
        throw new AggregationTypeInvalidBoundException(this._upperIndex, false);
      }
    }

    if (this._lowerIndex !== undefined && this._upperIndex !== undefined) {
      if (this._lowerIndex > this._upperIndex) {
        throw new AggregationTypeLowerIndexMustBeLessThanUpperIndexException(
          this._lowerIndex,
          this._upperIndex
        );
      }
    }

    if (this._lowerIndex !== undefined) {
      if (this._values.length < this._lowerIndex) {
        throw new AggregationTypeInvalidBoundException(this._lowerIndex, true);
      }
    }

    if (this._upperIndex !== undefined) {
      if (this._values.length > this._upperIndex) {
        throw new AggregationTypeInvalidBoundException(this._upperIndex, false);
      }
    }
  }
}

export default VariableSizeAggregationType;
