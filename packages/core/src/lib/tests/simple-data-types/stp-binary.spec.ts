import { STPBinary } from '../../simple-data-types';
import {
  InvalidDataTypeException,
  SimpleDataMaxLengthExceededException,
  SimpleDataStringMaxLengthNotAllowedException
} from '../../exceptions';

describe('STPBinary', () => {
  test('should create an instance with a valid value', () => {
    const stpBinary = new STPBinary('101010');
    expect(stpBinary.value).toBe('101010');
  });

  test('should return a the value', () => {
    const stpBinary = new STPBinary('101010');
    expect(stpBinary.value).toBe('101010');
  });

  test('should set a new value', () => {
    const stpBinary = new STPBinary('101010');
    stpBinary.value = '110110';
    expect(stpBinary.value).toBe('110110');
  });

  test('STPBinary should throw InvalidDataTypeException for an invalid value (non-string)', () => {
    expect(() => new STPBinary(10101 as unknown as string)).toThrow(
      InvalidDataTypeException
    );
  });

  test('STPBinary should throw InvalidDataTypeException for an invalid binary value', () => {
    expect(() => new STPBinary('invalid')).toThrow(
      InvalidDataTypeException
    );
  });

  test('STPBinary should create an instance with a valid binary value respecting max length', () => {
    const maxLength = 6;
    const stpBinary = new STPBinary('110110', maxLength);
    expect(stpBinary.value).toBe('110110');
  });

  test('STPBinary should throw SimpleDataMaxLengthExceededException for a binary value exceeding max length', () => {
    const maxLength = 5;
    expect(() => new STPBinary('101010', maxLength)).toThrow(
      SimpleDataMaxLengthExceededException
    );
  });

  test('STPBinary should throw SimpleDataStringMaxLengthNotAllowedException for an invalid max length (string)', () => {
    const invalidMaxLength = 'invalidLength';
    expect(
      () => new STPBinary('110110', invalidMaxLength as unknown as number)
    ).toThrow(SimpleDataStringMaxLengthNotAllowedException);
  });

  test('STPBinary should throw SimpleDataStringMaxLengthNotAllowedException for an invalid max length (negative number)', () => {
    const invalidMaxLength = -5;
    expect(() => new STPBinary('110110', invalidMaxLength)).toThrow(
      SimpleDataStringMaxLengthNotAllowedException
    );
  });

  test('STPBinary should throw SimpleDataStringMaxLengthNotAllowedException for an invalid max length (Infinity)', () => {
    const invalidMaxLength = Infinity;
    expect(() => new STPBinary('110110', invalidMaxLength)).toThrow(
      SimpleDataStringMaxLengthNotAllowedException
    );
  });

  test('STPBinary should throw SimpleDataStringMaxLengthNotAllowedException for an invalid max length (NaN)', () => {
    const invalidMaxLength = NaN;
    expect(() => new STPBinary('110110', invalidMaxLength)).toThrow(
      SimpleDataStringMaxLengthNotAllowedException
    );
  });

  test('STPBinary.fromHex should create an instance with a valid hexadecimal value', () => {
    const stpBinary = STPBinary.fromHex('1A');
    expect(stpBinary.value).toBe('00011010');
  });

  test('STPBinary.fromHex should throw InvalidDataTypeException for an invalid hexadecimal value', () => {
    expect(() => STPBinary.fromHex('invalid')).toThrow(
      InvalidDataTypeException
    );
  });

  test('STPBinary.fromHex should throw SimpleDataStringMaxLengthNotAllowedException for an invalid max length (NaN)', () => {
    expect(() => STPBinary.fromHex('1A', NaN)).toThrow(
      SimpleDataStringMaxLengthNotAllowedException
    );
  });
});
