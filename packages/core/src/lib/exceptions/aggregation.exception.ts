import { ExceptionBase } from './base.exception';
import {
  AGGREGATION_BELOW_LOWER_BOUND_EXCEPTION,
  AGGREGATION_EXCEEDED_UPPER_BOUND_EXCEPTION,
  AGGREGATION_INVALID_BOUND_EXCEPTION
} from './codes.exception';

/**
 * This exception is thrown when an aggregation is below the lower bound.
 */
export class AggregationBelowLowerBoundException extends ExceptionBase {
  code = AGGREGATION_BELOW_LOWER_BOUND_EXCEPTION;

  /**
   * Initializes a new instance of the class BelowLowerBoundException.
   * @param lowerBound The lower bound.
   */
  constructor(lowerBound: number) {
    super(`The aggregation is below the lower bound of ${lowerBound}.`);
  }
}

/**
 * This exception is thrown when an aggregation exceeds the upper bound.
 */
export class AggregationExceededUpperBoundException extends ExceptionBase {
  code = AGGREGATION_EXCEEDED_UPPER_BOUND_EXCEPTION;

  /**
   * Initializes a new instance of the class ExceededUpperBoundException.
   * @param upperBound The upper bound.
   */
  constructor(upperBound: number) {
    super(`The aggregation exceeds the upper bound of ${upperBound}.`);
  }
}

/**
 * This exception is thrown when an aggregation has an invalid bound.
 */
export class AggregationInvalidBoundException extends ExceptionBase {
  code = AGGREGATION_INVALID_BOUND_EXCEPTION;

  /**
   * Initializes a new instance of the class InvalidBoundException.
   * @param ound The bound value.
   */
  constructor(bound: number, isLowerBound: boolean) {
    super(`The ${isLowerBound ? 'lower' : 'upper'} bound ${bound} is invalid.`);
  }
}
