import { StringType } from '../../simple-data-types';
import {
  InvalidDataTypeException,
  SimpleTypeInvalidExpectedStringWidthException,
  SimpleTypeStringWidthNotAllowedException
} from '../../exceptions';

describe('StringType', () => {
  test('should create an instance of StringType with a valid value', () => {
    const newStringType = new StringType({ value: 'test' });
    expect(newStringType.value).toBe('test');
  });

  test('should throw an error if the value is not a valid value', () => {
    expect(() => new StringType({ value: 20 as unknown as string })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should return the value', () => {
    const value = 'test';
    const newStringType = new StringType({ value });
    expect(newStringType.value).toEqual(value);
  });

  test('should set the value', () => {
    const value = 'test';
    const newStringType = new StringType({ value: 'test2' });
    newStringType.value = value;
    expect(newStringType.value).toEqual(value);
  });

  test('StringType should create an instance with a valid string respecting width', () => {
    const width = 10;
    const newStringType = new StringType({ value: 'string', width });
    expect(newStringType.value).toBe('string');
  });

  test('should throw an error if the value is longer than the width', () => {
    expect(() => new StringType({ value: 'test', width: 3 })).toThrow(
      SimpleTypeInvalidExpectedStringWidthException
    );
  });

  test('StringType should throw SimpleTypeStringWidthNotAllowedException for an invalid width', () => {
    let invalidWidth: any = 'invalidLength';
    const props = { value: 'ValidString', width: invalidWidth };

    expect(() => new StringType(props)).toThrow(
      SimpleTypeStringWidthNotAllowedException
    );

    invalidWidth = -5;
    expect(() => new StringType(props)).toThrow(
      SimpleTypeStringWidthNotAllowedException
    );

    invalidWidth = Infinity;
    expect(() => new StringType(props)).toThrow(
      SimpleTypeStringWidthNotAllowedException
    );

    invalidWidth = -Infinity;
    expect(() => new StringType(props)).toThrow(
      SimpleTypeStringWidthNotAllowedException
    );

    invalidWidth = NaN;
    expect(() => new StringType(props)).toThrow(
      SimpleTypeStringWidthNotAllowedException
    );
  });

  test('should throw an error if the value has a width different than the fixedWidth width', () => {
    expect(
      () => new StringType({ value: 'test', width: 5, fixedWidth: true })
    ).toThrow(SimpleTypeInvalidExpectedStringWidthException);
  });

  test('should throw an error if the value is not a valid hex string', () => {
    expect(() => new StringType({ value: 'test', encoded: true })).toThrow(
      InvalidDataTypeException
    );
  });

  test('should create an instance of StringType with a valid encoded value', () => {
    const newStringType = new StringType({
      value: '00000000 00000000 00000000 00000000',
      encoded: true
    });
    expect(newStringType.value).toBe('00000000 00000000 00000000 00000000');
  });

  test('should set the encoded value', () => {
    const value = '00000000 00000000 00000000 00000000';
    const newStringType = new StringType({
      value: '00000000 00000000 00000000 00000001',
      encoded: true
    });
    newStringType.value = value;
    expect(newStringType.value).toEqual(value);
  });

  test('should throw if value is encoded and does not match the expected width', () => {
    expect(
      () =>
        new StringType({
          value: '00000000 00000000 00000000 00000000 00000000',
          width: 4,
          fixedWidth: true,
          encoded: true
        })
    ).toThrow(SimpleTypeInvalidExpectedStringWidthException);
  });
});
