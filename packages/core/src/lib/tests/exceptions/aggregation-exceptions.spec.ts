import {
  AggregationBelowLowerBoundException,
  AggregationExceededUpperBoundException,
  AggregationInvalidBoundException,
  AGGREGATION_BELOW_LOWER_BOUND_EXCEPTION,
  AGGREGATION_EXCEEDED_UPPER_BOUND_EXCEPTION,
  AGGREGATION_INVALID_BOUND_EXCEPTION
} from '../../exceptions';

describe('AggregationBelowLowerBoundException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception = new AggregationBelowLowerBoundException(5);
    expect(exception.message).toBe(
      'The aggregation is below the lower bound of 5.'
    );
    expect(exception.code).toBe(AGGREGATION_BELOW_LOWER_BOUND_EXCEPTION);
  });
});

describe('AggregationExceededUpperBoundException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception = new AggregationExceededUpperBoundException(10);
    expect(exception.message).toBe(
      'The aggregation exceeds the upper bound of 10.'
    );
    expect(exception.code).toBe(AGGREGATION_EXCEEDED_UPPER_BOUND_EXCEPTION);
  });
});

describe('AggregationInvalidBoundException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception = new AggregationInvalidBoundException(5, true);
    expect(exception.message).toBe('The lower bound 5 is invalid.');
    expect(exception.code).toBe(AGGREGATION_INVALID_BOUND_EXCEPTION);
  });
});

