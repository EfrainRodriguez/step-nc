import { LogicalType } from '../../simple-data-types';
import { InvalidDataTypeException } from '../../exceptions';

describe('LogicalType', () => {
  test('should create an instance of LogicalType with a valid boolean (true)', () => {
    const newLogicalType = new LogicalType({ value: true });
    expect(newLogicalType.value).toBe(true);
  });

  test('should create an instance of LogicalType with a valid boolean (false)', () => {
    const newLogicalType = new LogicalType({ value: false });
    expect(newLogicalType.value).toBe(false);
  });

  test('should create an instance of LogicalType with a valid logical (undefined)', () => {
    const newLogicalType = new LogicalType({ value: undefined });
    expect(newLogicalType.value).toBe(undefined);
  });

  test('should throw InvalidDataTypeException for an invalid logical (number)', () => {
    expect(
      () => new LogicalType({ value: 42 as unknown as boolean | undefined })
    ).toThrow(InvalidDataTypeException);
  });

  test('should return the value', () => {
    const value = true;
    const newLogicalType = new LogicalType({ value });
    expect(newLogicalType.value).toEqual(value);
  });

  test('should set the value', () => {
    const value = true;
    const newLogicalType = new LogicalType({ value: false });
    newLogicalType.value = value;
    expect(newLogicalType.value).toEqual(value);
  });
});
