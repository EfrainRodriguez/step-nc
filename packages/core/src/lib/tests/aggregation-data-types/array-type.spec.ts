import { ArrayType } from '../../aggregation-data-types';
import {
  AggregationTypeLowerIndexMustBeLessThanUpperIndexException,
  AggregationTypeInvalidBoundException,
  AggregationTypeOutOfBoundsException
} from '../../exceptions';

describe('ArrayType', () => {
  const newArrayType = new ArrayType<number>({
    values: [1, 2, 3],
    lowerIndex: 0,
    upperIndex: 5,
    uniqueFlag: false,
    optionalFlag: true
  });
  test('should create an instance of ArrayType and return the items', () => {
    expect(newArrayType).toBeInstanceOf(ArrayType);
    expect(newArrayType.getValues()).toEqual([1, 2, 3]);
  });

  test('should return a item by value', () => {
    expect(newArrayType.get(2)).toEqual(2);
  });

  test('should return a item at index', () => {
    expect(newArrayType.getAt(1)).toEqual(2);
  });

  test('should empty the array', () => {
    const emptyArrayType = new ArrayType<number>({
      values: [],
      lowerIndex: 0,
      upperIndex: 5,
      uniqueFlag: false,
      optionalFlag: true
    });
    expect(emptyArrayType.getValues()).toEqual([]);
  });

  test('should validate unique and optional properties', () => {
    const uniqueOptionalArrayType = new ArrayType<number>({
      values: [1, 1, 2, undefined as unknown as number],
      lowerIndex: 1,
      upperIndex: 5,
      uniqueFlag: true,
      optionalFlag: true
    });
    expect(uniqueOptionalArrayType.getValues()).toEqual([1, 2]);
  });

  test('should validate invalid index', () => {
    expect(
      () =>
        new ArrayType<number>({
          values: [1, 2, 3],
          lowerIndex: NaN,
          upperIndex: 5,
          uniqueFlag: false,
          optionalFlag: true
        })
    ).toThrow(AggregationTypeInvalidBoundException);

    expect(
      () =>
        new ArrayType<number>({
          values: [1, 2, 3],
          lowerIndex: 1,
          upperIndex: NaN,
          uniqueFlag: false,
          optionalFlag: true
        })
    ).toThrow(AggregationTypeInvalidBoundException);
  });

  test('should validate lower index greater than upper index', () => {
    expect(
      () =>
        new ArrayType<number>({
          values: [1, 2, 3],
          lowerIndex: 3,
          upperIndex: 2,
          uniqueFlag: false,
          optionalFlag: true
        })
    ).toThrow(AggregationTypeLowerIndexMustBeLessThanUpperIndexException);
  });

  test('should add and remove items', () => {
    const newArrayType = new ArrayType<number>({
      values: [],
      lowerIndex: 0,
      upperIndex: 5,
      uniqueFlag: false,
      optionalFlag: true
    });
    newArrayType.add(1);
    newArrayType.add(2);
    expect(newArrayType.getValues()).toEqual([1, 2]);
    newArrayType.remove(1);
    expect(newArrayType.getValues()).toEqual([2]);
  });

  test('should insert and remove at index', () => {
    const newArrayType = new ArrayType<number>({
      values: [1, 2, 3],
      lowerIndex: 0,
      upperIndex: 5,
      uniqueFlag: false,
      optionalFlag: true
    });
    newArrayType.insertAt(1, 4);
    expect(newArrayType.getValues()).toEqual([1, 4, 2, 3]);
    newArrayType.removeAt(1);
    expect(newArrayType.getValues()).toEqual([1, 2, 3]);
  });

  test('should validate out of bounds', () => {
    const newArrayType = new ArrayType<number>({
      values: [1, 2, 3],
      lowerIndex: 0,
      upperIndex: 5,
      uniqueFlag: false,
      optionalFlag: true
    });
    expect(() => newArrayType.getAt(6)).toThrow(AggregationTypeOutOfBoundsException);
    expect(() => newArrayType.insertAt(6, 1)).toThrow(AggregationTypeOutOfBoundsException);
    expect(() => newArrayType.removeAt(6)).toThrow(AggregationTypeOutOfBoundsException);
  });

  test('should handle negative index', () => {
    const newArrayType = new ArrayType<number>({
      values: [1, 2, 3],
      lowerIndex: -2,
      upperIndex: 5,
      uniqueFlag: false,
      optionalFlag: true
    });
    expect(newArrayType.getAt(-2)).toEqual(1);
    expect(newArrayType.getAt(0)).toEqual(3);
    expect(() => newArrayType.getAt(-3)).toThrow(AggregationTypeOutOfBoundsException);
    expect(() => newArrayType.getAt(6)).toThrow(AggregationTypeOutOfBoundsException);
  });
});
