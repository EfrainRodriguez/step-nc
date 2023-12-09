import { STPLogical, LogicalBase } from '../../simple-data-types';
import { InvalidDataTypeException } from '../../exceptions';

describe('STPLogical', () => {
  test('should create an instance of STPLogical with a valid boolean (true)', () => {
    const stpLogical = new STPLogical(true);
    expect(stpLogical.value).toBe(true);
  });

  test('should create an instance of STPLogical with a valid boolean (false)', () => {
    const stpLogical = new STPLogical(false);
    expect(stpLogical.value).toBe(false);
  });

  test('should create an instance of STPLogical with a valid logical (undefined)', () => {
    const stpLogical = new STPLogical(undefined);
    expect(stpLogical.value).toBe(undefined);
  });

  test('should throw InvalidDataTypeException for an invalid logical (number)', () => {
    expect(() => new STPLogical(42 as unknown as LogicalBase)).toThrow(
      InvalidDataTypeException
    );
  });

  test('should return the value', () => {
    const value = true;
    const stpLogical = new STPLogical(value);
    expect(stpLogical.value).toEqual(value);
  });

  test('should set the value', () => {
    const value = true;
    const stpLogical = new STPLogical(false);
    stpLogical.value = value;
    expect(stpLogical.value).toEqual(value);
  });
});
