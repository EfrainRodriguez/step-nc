import { NumberType } from '../../simple-data-types';
import { InvalidDataTypeException } from '../../exceptions';

describe('NumberType', () => {
  test('should create an instance of NumberType with a valid number', () => {
    const newNumberType = new NumberType({ value: 20 });
    expect(newNumberType.value).toBe(20);
  });

  test('should throw an error if the value is not a number', () => {
    expect(() => new NumberType({ value: '20' as unknown as number })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should throw an error if the value is NaN', () => {
    expect(() => new NumberType({ value: NaN })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should throw InvalidDataTypeException for Infinity', () => {
    expect(() => new NumberType({ value: Infinity })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should throw InvalidDataTypeException for -Infinity', () => {
    expect(() => new NumberType({ value: -Infinity })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should return the value', () => {
    const value = 0;
    const newNumberType = new NumberType({ value });
    expect(newNumberType.value).toEqual(value);
  });

  test('should set the value', () => {
    const value = 0;
    const newNumberType = new NumberType({ value: 1 });
    newNumberType.value = value;
    expect(newNumberType.value).toEqual(value);
  });
});
