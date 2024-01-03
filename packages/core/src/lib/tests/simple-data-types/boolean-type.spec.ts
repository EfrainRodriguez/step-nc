import { BooleanType } from '../../simple-data-types';
import { InvalidDataTypeException } from '../../exceptions';

describe('BooleanType', () => {
  test('should create an instance of BooleanType with a valid value (true)', () => {
    const newBooleanType = new BooleanType({ value: true });
    expect(newBooleanType.value).toBe(true);
  });

  test('should create an instance of BooleanType with a valid value (false)', () => {
    const newBooleanType = new BooleanType({ value: false });
    expect(newBooleanType.value).toBe(false);
  });

  test('should throw an error if the value is not a valid value', () => {
    expect(
      () => new BooleanType({ value: '20' as unknown as boolean })
    ).toThrow(InvalidDataTypeException);
  });

  test('should return the value', () => {
    const value = true;
    const newBooleanType = new BooleanType({ value });
    expect(newBooleanType.value).toEqual(value);
  });

  test('should set the value', () => {
    const value = true;
    const newBooleanType = new BooleanType({ value: false });
    newBooleanType.value = value;
    expect(newBooleanType.value).toEqual(value);
  });
});
