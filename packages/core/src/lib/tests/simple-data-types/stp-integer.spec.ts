import { STPInteger } from '../../simple-data-types';
import { SimpleDataInvalidValueException } from '../../exceptions';

describe('STPInteger', () => {
  test('should create an instance of STPInteger with a valid number', () => {
    const stpInteger = new STPInteger(20);
    expect(stpInteger.value).toBe(20);
  });

  test('should throw an error if the value is not a number', () => {
    expect(() => new STPInteger('20' as unknown as number)).toThrow(
      SimpleDataInvalidValueException
    );
  });

  test('should throw an error if the value is NaN', () => {
    expect(() => new STPInteger(NaN)).toThrow(SimpleDataInvalidValueException);
  });

  test('should throw SimpleDataInvalidValueException for Infinity', () => {
    expect(() => new STPInteger(Infinity)).toThrow(
      SimpleDataInvalidValueException
    );
  });

  test('should throw SimpleDataInvalidValueException for -Infinity', () => {
    expect(() => new STPInteger(-Infinity)).toThrow(
      SimpleDataInvalidValueException
    );
  });

  test('should return the value', () => {
    const value = 0;
    const stpInteger = new STPInteger(value);
    expect(stpInteger.value).toEqual(value);
  });

  test('should set the value', () => {
    const value = 0;
    const stpInteger = new STPInteger(1);
    stpInteger.value = value;
    expect(stpInteger.value).toEqual(value);
  });
});
