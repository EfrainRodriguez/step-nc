import { STPBoolean } from '../../simple-data-types';
import { InvalidDataTypeException } from '../../exceptions';

describe('STPBoolean', () => {
  test('should create an instance of STPBoolean with a valid value (true)', () => {
    const stpBoolean = new STPBoolean(true);
    expect(stpBoolean.value).toBe(true);
  });

  test('should create an instance of STPBoolean with a valid value (false)', () => {
    const stpBoolean = new STPBoolean(false);
    expect(stpBoolean.value).toBe(false);
  });

  test('should throw an error if the value is not a valid value', () => {
    expect(() => new STPBoolean('20' as unknown as boolean)).toThrow(
      InvalidDataTypeException
    );
  });

  test('should return the value', () => {
    const value = true;
    const stpBoolean = new STPBoolean(value);
    expect(stpBoolean.value).toEqual(value);
  });

  test('should set the value', () => {
    const value = true;
    const stpBoolean = new STPBoolean(false);
    stpBoolean.value = value;
    expect(stpBoolean.value).toEqual(value);
  });
});
