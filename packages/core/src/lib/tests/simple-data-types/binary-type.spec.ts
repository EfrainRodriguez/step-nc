import { BinaryType } from '../../simple-data-types';
import {
  InvalidDataTypeException,
  SimpleTypeInvalidExpectedStringWidthException,
  SimpleTypeStringWidthNotAllowedException
} from '../../exceptions';

describe('BinaryType', () => {
  test('should create an instance with a valid value', () => {
    const newBinaryType = new BinaryType({ value: '101010' });
    expect(newBinaryType.value).toBe('101010');
  });

  test('should return a the value', () => {
    const newBinaryType = new BinaryType({ value: '101010' });
    expect(newBinaryType.value).toBe('101010');
  });

  test('should set a new value', () => {
    const newBinaryType = new BinaryType({ value: '101010' });
    newBinaryType.value = '110110';
    expect(newBinaryType.value).toBe('110110');
  });

  test('BinaryType should throw InvalidDataTypeException for an invalid value (non-string)', () => {
    expect(() => new BinaryType({ value: 10101 as unknown as string })).toThrow(
      InvalidDataTypeException
    );
  });

  test('BinaryType should throw InvalidDataTypeException for an invalid binary value', () => {
    expect(() => new BinaryType({ value: 'invalid' })).toThrow(
      InvalidDataTypeException
    );
  });

  test('BinaryType should create an instance with a valid binary value respecting width', () => {
    const width = 6;
    const newBinaryType = new BinaryType({ value: '110110', width });
    expect(newBinaryType.value).toBe('110110');
  });

  test('BinaryType should throw SimpleTypeInvalidExpectedStringWidthException for a binary value exceeding width', () => {
    const width = 5;
    expect(() => new BinaryType({ value: '101010', width })).toThrow(
      SimpleTypeInvalidExpectedStringWidthException
    );
  });

  test('BinaryType should throw SimpleTypeStringWidthNotAllowedException for an invalid width', () => {
    let invalidWidth: any = 'invalidLength';
    const props = {
      value: '110110',
      width: invalidWidth as unknown as number
    };
    expect(() => new BinaryType(props)).toThrow(
      SimpleTypeStringWidthNotAllowedException
    );

    invalidWidth = -5;
    expect(() => new BinaryType(props)).toThrow(
      SimpleTypeStringWidthNotAllowedException
    );

    invalidWidth = Infinity;
    expect(() => new BinaryType(props)).toThrow(
      SimpleTypeStringWidthNotAllowedException
    );

    invalidWidth = NaN;
    expect(() => new BinaryType(props)).toThrow(
      SimpleTypeStringWidthNotAllowedException
    );
  });

  test('should throw an error if the value has a width different than the fixed width', () => {
    expect(
      () => new BinaryType({ value: '101010', width: 5, fixedWidth: true })
    ).toThrow(SimpleTypeInvalidExpectedStringWidthException);
  });

  test('BinaryType.fromHex should create an instance with a valid hexadecimal value', () => {
    const newBinaryType = BinaryType.fromHex({ value: '1A' });
    expect(newBinaryType.value).toBe('00011010');
  });

  test('BinaryType.fromHex should throw InvalidDataTypeException for an invalid hexadecimal value', () => {
    expect(() => BinaryType.fromHex({ value: 'invalid' })).toThrow(
      InvalidDataTypeException
    );
  });

  test('BinaryType.fromHex should throw SimpleTypeStringWidthNotAllowedException for an invalid width (NaN)', () => {
    expect(() => BinaryType.fromHex({ value: '1A', width: NaN })).toThrow(
      SimpleTypeStringWidthNotAllowedException
    );
  });
});
