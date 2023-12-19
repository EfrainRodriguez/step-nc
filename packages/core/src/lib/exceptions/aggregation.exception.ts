import { ExceptionBase } from './base.exception';
import {
  AGGREGATION_TYPE_LOWER_INDEX_MUST_BE_LESS_THAN_UPPER_INDEX_EXCEPTION,
  AGGREGATION_TYPE_INVALID_BOUND_EXCEPTION,
  AGGREGATION_TYPE_OUT_OF_BOUNDS_EXCEPTION
} from './codes.exception';

/**
 * This exception is thrown when an aggregation has a lower index greater than the upper index.
 */
export class AggregationTypeLowerIndexMustBeLessThanUpperIndexException extends ExceptionBase {
  code = AGGREGATION_TYPE_LOWER_INDEX_MUST_BE_LESS_THAN_UPPER_INDEX_EXCEPTION;

  /**
   * Initializes a new instance of the class AggregationTypeLowerIndexMustBeLessThanUpperIndexException.
   * @param lowerBound The lower bound.
   * @param upperBound The upper bound.
   */
  constructor(lowerBound: number, upperBound: number) {
    super(
      `The lower bound ${lowerBound} must be less than the upper bound ${upperBound}.`
    );
  }
}

/**
 * This exception is thrown when an aggregation has an invalid bound.
 */
export class AggregationTypeInvalidBoundException extends ExceptionBase {
  code = AGGREGATION_TYPE_INVALID_BOUND_EXCEPTION;

  /**
   * Initializes a new instance of the class AggregationTypeInvalidBoundException.
   * @param bound The bound.
   * @param isLowerBound Indicates whether the bound is a lower bound.
   */
  constructor(bound: number, isLowerBound: boolean) {
    super(`The ${isLowerBound ? 'lower' : 'upper'} bound ${bound} is invalid.`);
  }
}

/**
 * This exception is thrown when an aggregation is out of bounds.
 */
export class AggregationTypeOutOfBoundsException extends ExceptionBase {
  code = AGGREGATION_TYPE_OUT_OF_BOUNDS_EXCEPTION;

  /**
   * Initializes a new instance of the class AggregationTypeOutOfBoundsException.
   * @param index The index value.
   */
  constructor(index: number) {
    super(`The index ${index} is out of bounds.`);
  }
}
