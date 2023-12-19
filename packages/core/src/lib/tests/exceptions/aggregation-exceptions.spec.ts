import {
  AggregationTypeLowerIndexMustBeLessThanUpperIndexException,
  AggregationTypeInvalidBoundException,
  AGGREGATION_TYPE_LOWER_INDEX_MUST_BE_LESS_THAN_UPPER_INDEX_EXCEPTION,
  AGGREGATION_TYPE_INVALID_BOUND_EXCEPTION
} from '../../exceptions';

describe('AggregationTypeLowerIndexMustBeLessThanUpperIndexException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception =
      new AggregationTypeLowerIndexMustBeLessThanUpperIndexException(5, 4);
    expect(exception.message).toBe(
      'The lower bound 5 must be less than the upper bound 4.'
    );
    expect(exception.code).toBe(
      AGGREGATION_TYPE_LOWER_INDEX_MUST_BE_LESS_THAN_UPPER_INDEX_EXCEPTION
    );
  });
});

describe('AggregationTypeInvalidBoundException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception = new AggregationTypeInvalidBoundException(5, true);
    expect(exception.message).toBe('The lower bound 5 is invalid.');
    expect(exception.code).toBe(AGGREGATION_TYPE_INVALID_BOUND_EXCEPTION);
  });
});
