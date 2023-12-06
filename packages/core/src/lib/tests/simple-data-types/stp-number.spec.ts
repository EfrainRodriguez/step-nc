import { STPNumber } from '../../simple-data-types';
import { SimpleDataInvalidValueException } from '../../exceptions';

describe('STPNumber', () => {
  test('should create an instance of STPNumber with a valid number', () => {
    const stpNumber = new STPNumber(20);
    expect(stpNumber.value).toBe(20);
  });

  test('should throw an error if the value is not a number', () => {
    expect(() => new STPNumber('20' as unknown as number)).toThrow(
      SimpleDataInvalidValueException
    );
  });

  test('should throw an error if the value is NaN', () => {
    expect(() => new STPNumber(NaN)).toThrow(SimpleDataInvalidValueException);
  });

  test('should throw SimpleDataInvalidValueException for Infinity', () => {
    expect(() => new STPNumber(Infinity)).toThrow(
      SimpleDataInvalidValueException
    );
  });

  test('should throw SimpleDataInvalidValueException for -Infinity', () => {
    expect(() => new STPNumber(-Infinity)).toThrow(
      SimpleDataInvalidValueException
    );
  });

  test('should return the value', () => {
    const value = 0;
    const stpNumber = new STPNumber(value);
    expect(stpNumber.value).toEqual(value);
  });

  test('should set the value', () => {
    const value = 0;
    const stpNumber = new STPNumber(1);
    stpNumber.value = value;
    expect(stpNumber.value).toEqual(value);
  });
});
