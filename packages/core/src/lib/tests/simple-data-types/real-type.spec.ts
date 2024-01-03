import { RealType } from '../../simple-data-types';
import {
  InvalidDataTypeException,
  SimpleTypeRealPrecisionNotAllowedException
} from '../../exceptions';

describe('RealType', () => {
  test('should create an instance of RealType with a valid number', () => {
    const newRealType = new RealType({ value: 42.123 });
    expect(newRealType.value).toBe(42.123);
  });

  test('should round the value based on precision', () => {
    const newRealType = new RealType({ value: 42.123456, precision: 2 });
    expect(newRealType.value).toBe(42.12);
  });

  test('should throw InvalidDataTypeException for an invalid number', () => {
    expect(() => new RealType({ value: '20.20' as unknown as number })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should throw InvalidDataTypeException for NaN', () => {
    expect(() => new RealType({ value: NaN })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should throw InvalidDataTypeException for Infinity', () => {
    expect(() => new RealType({ value: Infinity })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should throw InvalidDataTypeException for -Infinity', () => {
    expect(() => new RealType({ value: -Infinity })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should not throw for valid precision', () => {
    const newRealType = new RealType({ value: 42.123, precision: 2 });
    expect(newRealType.value).toBe(42.12);
  });

  test('should throw SimpleTypeRealPrecisionNotAllowedException for precision value out of range', () => {
    expect(() => new RealType({ value: 42.123, precision: 20 })).toThrow(
      SimpleTypeRealPrecisionNotAllowedException
    );
  });

  test('should throw SimpleTypeRealPrecisionNotAllowedException for an invalid precision value', () => {
    expect(() => new RealType({ value: 42.123, precision: NaN })).toThrow(
      SimpleTypeRealPrecisionNotAllowedException
    );
  });

  test('should return the value', () => {
    const value = 0;
    const newRealType = new RealType({ value });
    expect(newRealType.value).toEqual(value);
  });

  test('should set the value', () => {
    const value = 0;
    const newRealType = new RealType({ value: 1 });
    newRealType.value = value;
    expect(newRealType.value).toEqual(value);
  });
});
