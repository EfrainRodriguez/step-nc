import {
  SimpleDataInvalidValueException,
  SimpleDataMaxLengthExceededException,
  SimpleDataRealPrecisionNotAllowedException,
  SimpleDataStringMaxLengthNotAllowedException,
  SIMPLE_DATA_INVALID_VALUE_EXCEPTION,
  SIMPLE_DATA_MAX_LENGTH_EXCEEDED_EXCEPTION,
  SIMPLE_DATA_REAL_PRECISION_NOT_ALLOWED_EXCEPTION,
  SIMPLE_DATA_STRING_MAX_LENGTH_NOT_ALLOWED_EXCEPTION
} from '../../exceptions';

describe('SimpleDataInvalidValueException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception = new SimpleDataInvalidValueException('invalid', 'Type');
    expect(exception.message).toBe('The value invalid is not a valid Type.');
    expect(exception.code).toBe(SIMPLE_DATA_INVALID_VALUE_EXCEPTION);
  });
});

describe('SimpleDataMaxLengthExceededException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception = new SimpleDataMaxLengthExceededException('value', 10);
    expect(exception.message).toBe(
      'The value value exceeds the maximum length of 10.'
    );
    expect(exception.code).toBe(SIMPLE_DATA_MAX_LENGTH_EXCEEDED_EXCEPTION);
  });
});

describe('SimpleDataRealPrecisionNotAllowedException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception = new SimpleDataRealPrecisionNotAllowedException(5);
    expect(exception.message).toBe('The precision 5 is not allowed.');
    expect(exception.code).toBe(
      SIMPLE_DATA_REAL_PRECISION_NOT_ALLOWED_EXCEPTION
    );
  });
});

describe('SimpleDataStringMaxLengthNotAllowedException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception = new SimpleDataStringMaxLengthNotAllowedException(15);
    expect(exception.message).toBe('The maximum length 15 is not allowed.');
    expect(exception.code).toBe(
      SIMPLE_DATA_STRING_MAX_LENGTH_NOT_ALLOWED_EXCEPTION
    );
  });
});
