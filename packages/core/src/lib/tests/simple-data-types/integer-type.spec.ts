import { IntegerType } from '../../simple-data-types';
import { InvalidDataTypeException } from '../../exceptions';

describe('IntegerType', () => {
  test('should create an instance of IntegerType with a valid number', () => {
    const newIntegerType = new IntegerType({ value: 20 });
    expect(newIntegerType.value).toBe(20);
  });

  test('should throw an error if the value is not a number', () => {
    expect(() => new IntegerType({ value: '20' as unknown as number })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should throw an error if the value is NaN', () => {
    expect(() => new IntegerType({ value: NaN })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should throw InvalidDataTypeException for Infinity', () => {
    expect(() => new IntegerType({ value: Infinity })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should throw InvalidDataTypeException for -Infinity', () => {
    expect(() => new IntegerType({ value: -Infinity })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should return the value', () => {
    const value = 0;
    const newIntegerType = new IntegerType({ value });
    expect(newIntegerType.value).toEqual(value);
  });

  test('should set the value', () => {
    const value = 0;
    const newIntegerType = new IntegerType({ value: 1 });
    newIntegerType.value = value;
    expect(newIntegerType.value).toEqual(value);
  });
});
