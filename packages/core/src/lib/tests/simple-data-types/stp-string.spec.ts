import { STPString } from '../../simple-data-types';
import {
  SimpleDataInvalidValueException,
  SimpleDataMaxLengthExceededException,
  SimpleDataStringMaxLengthNotAllowedException
} from '../../exceptions';

describe('STPString', () => {
  test('should create an instance of STPString with a valid value', () => {
    const stpString = new STPString('test');
    expect(stpString.value).toBe('test');
  });

  test('should throw an error if the value is not a valid value', () => {
    expect(() => new STPString(20 as unknown as string)).toThrow(
      SimpleDataInvalidValueException
    );
  });

  test('should return the value', () => {
    const value = 'test';
    const stpString = new STPString(value);
    expect(stpString.value).toEqual(value);
  });

  test('should set the value', () => {
    const value = 'test';
    const stpString = new STPString('test2');
    stpString.value = value;
    expect(stpString.value).toEqual(value);
  });

  test('STPString should create an instance with a valid string respecting max length', () => {
    const maxLength = 10;
    const stpString = new STPString('string', maxLength);
    expect(stpString.value).toBe('string');
  });

  test('should throw an error if the value is longer than the max length', () => {
    expect(() => new STPString('test', 3)).toThrow(
      SimpleDataMaxLengthExceededException
    );
  });

  test('STPString should throw SimpleDataStringMaxLengthNotAllowedException for an invalid max length (string)', () => {
    const invalidMaxLength = 'invalidLength';
    expect(
      () => new STPString('ValidString', invalidMaxLength as unknown as number)
    ).toThrow(SimpleDataStringMaxLengthNotAllowedException);
  });

  test('STPString should throw SimpleDataStringMaxLengthNotAllowedException for an invalid max length (negative number)', () => {
    const invalidMaxLength = -5;
    expect(() => new STPString('ValidString', invalidMaxLength)).toThrow(
      SimpleDataStringMaxLengthNotAllowedException
    );
  });

  test('STPString should throw SimpleDataStringMaxLengthNotAllowedException for an invalid max length (Infinity)', () => {
    const invalidMaxLength = Infinity;
    expect(() => new STPString('ValidString', invalidMaxLength)).toThrow(
      SimpleDataStringMaxLengthNotAllowedException
    );
  });

  test('STPString should throw SimpleDataStringMaxLengthNotAllowedException for an invalid max length (NaN)', () => {
    const invalidMaxLength = NaN;
    expect(() => new STPString('ValidString', invalidMaxLength)).toThrow(
      SimpleDataStringMaxLengthNotAllowedException
    );
  });
});
