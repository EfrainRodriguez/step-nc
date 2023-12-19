import {
  InvalidDataTypeException,
  SimpleTypeInvalidExpectedStringWidthException,
  SimpleTypeRealPrecisionNotAllowedException,
  SimpleTypeStringWidthNotAllowedException,
  INVALID_DATA_TYPE_EXCEPTION,
  SIMPLE_DATA_INVALID_EXPECTED_STRING_WIDTH_EXCEPTION,
  SIMPLE_DATA_REAL_PRECISION_NOT_ALLOWED_EXCEPTION,
  SIMPLE_DATA_STRING_WIDTH_NOT_ALLOWED_EXCEPTION
} from '../../exceptions';

describe('InvalidDataTypeException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception = new InvalidDataTypeException('invalid', 'Type');
    expect(exception.message).toBe('The value invalid is not a valid Type.');
    expect(exception.code).toBe(INVALID_DATA_TYPE_EXCEPTION);
  });
});

describe('SimpleTypeInvalidExpectedStringWidthException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception = new SimpleTypeInvalidExpectedStringWidthException(
      'value',
      10,
      'type'
    );
    expect(exception.message).toBe(
      'The string width 5 does not match the expected width 10 of the current type type.'
    );
    expect(exception.code).toBe(
      SIMPLE_DATA_INVALID_EXPECTED_STRING_WIDTH_EXCEPTION
    );
  });
});

describe('SimpleTypeRealPrecisionNotAllowedException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception = new SimpleTypeRealPrecisionNotAllowedException(5);
    expect(exception.message).toBe('The precision 5 is not allowed.');
    expect(exception.code).toBe(
      SIMPLE_DATA_REAL_PRECISION_NOT_ALLOWED_EXCEPTION
    );
  });
});

describe('SimpleTypeStringWidthNotAllowedException', () => {
  it('should create an instance with the correct message and code', () => {
    const exception = new SimpleTypeStringWidthNotAllowedException(15);
    expect(exception.message).toBe('The maximum length 15 is not allowed.');
    expect(exception.code).toBe(SIMPLE_DATA_STRING_WIDTH_NOT_ALLOWED_EXCEPTION);
  });
});
