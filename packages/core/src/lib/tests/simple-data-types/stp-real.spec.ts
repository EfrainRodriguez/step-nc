import { STPReal } from '../../simple-data-types';
import {
  SimpleDataInvalidValueException,
  SimpleDataRealPrecisionNotAllowedException
} from '../../exceptions';

describe('STPReal', () => {
  test('should create an instance of STPReal with a valid number', () => {
    const stpReal = new STPReal(42.123);
    expect(stpReal.value).toBe(42.123);
  });

  test('should round the value based on precision', () => {
    const stpReal = new STPReal(42.123456, 2);
    expect(stpReal.value).toBe(42.12);
  });

  test('should throw SimpleDataInvalidValueException for an invalid number', () => {
    expect(() => new STPReal('20.20' as unknown as number)).toThrow(
      SimpleDataInvalidValueException
    );
  });

  test('should throw SimpleDataInvalidValueException for NaN', () => {
    expect(() => new STPReal(NaN)).toThrow(SimpleDataInvalidValueException);
  });

  test('should throw SimpleDataInvalidValueException for Infinity', () => {
    expect(() => new STPReal(Infinity)).toThrow(
      SimpleDataInvalidValueException
    );
  });

  test('should throw SimpleDataInvalidValueException for -Infinity', () => {
    expect(() => new STPReal(-Infinity)).toThrow(
      SimpleDataInvalidValueException
    );
  });

  test('should not throw for valid precision', () => {
    const stpReal = new STPReal(42.123, 2);
    expect(stpReal.value).toBe(42.12);
  });

  test('should throw SimpleDataRealPrecisionNotAllowedException for precision value out of range', () => {
    expect(() => new STPReal(42.123, 20)).toThrow(
      SimpleDataRealPrecisionNotAllowedException
    );
  });

  test('should throw SimpleDataRealPrecisionNotAllowedException for an invalid precision value', () => {
    expect(() => new STPReal(42.123, NaN)).toThrow(
      SimpleDataRealPrecisionNotAllowedException
    );
  });

  test('should return the value', () => {
    const value = 0;
    const stpReal = new STPReal(value);
    expect(stpReal.value).toEqual(value);
  });

  test('should set the value', () => {
    const value = 0;
    const stpReal = new STPReal(1);
    stpReal.value = value;
    expect(stpReal.value).toEqual(value);
  });
});
