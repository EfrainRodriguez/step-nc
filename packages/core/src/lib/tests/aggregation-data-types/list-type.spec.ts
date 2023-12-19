import { ListType } from '../../aggregation-data-types';
import {
  AggregationTypeLowerIndexMustBeLessThanUpperIndexException,
  AggregationTypeInvalidBoundException,
  AggregationTypeOutOfBoundsException
} from '../../exceptions';

describe('ListType', () => {
  const newListType = new ListType<number>({ values: [1, 2, 3] });
  test('should create an instance of ListType and return the items', () => {
    expect(newListType).toBeInstanceOf(ListType);
    expect(newListType.getValues()).toEqual([1, 2, 3]);
  });

  test('should return a item by value', () => {
    expect(newListType.get(2)).toEqual(2);
  });

  test('should return a item at index', () => {
    expect(newListType.getAt(1)).toEqual(2);
  });

  test('should empty the list', () => {
    const newListType = new ListType<number>({ values: [] });
    expect(newListType.getValues()).toEqual([]);
  });

  test('should validate unique properties', () => {
    const newListType = new ListType<number>({
      values: [1, 1, 2],
      uniqueFlag: true
    });
    expect(newListType.getValues()).toEqual([1, 2]);
  });

  test('should throws an error if the bounds are invalid', () => {
    expect(
      () => new ListType<number>({ values: [1, 2, 3], lowerIndex: NaN })
    ).toThrow(AggregationTypeInvalidBoundException);
    expect(
      () => new ListType<number>({ values: [1, 2, 3], upperIndex: NaN })
    ).toThrow(AggregationTypeInvalidBoundException);
  });

  test('should throws an error if the lower bound is greater than the upper bound', () => {
    expect(
      () =>
        new ListType<number>({
          values: [1, 2, 3],
          lowerIndex: 3,
          upperIndex: 2
        })
    ).toThrow(AggregationTypeLowerIndexMustBeLessThanUpperIndexException);
  });

  test('should throws an error if the index is out of bounds', () => {
    expect(() => newListType.getAt(10)).toThrow(
      AggregationTypeOutOfBoundsException
    );
  });

  test('should add and remove items', () => {
    newListType.add(1);
    newListType.add(2);
    expect(newListType.getValues()).toEqual([1, 2, 3, 1, 2]);
    newListType.remove(1);
    expect(newListType.getValues()).toEqual([2, 3, 1, 2]);
  });

  test('should insert and remove at index', () => {
    const newListType = new ListType<number>({
      values: [1, 2, 3],
      lowerIndex: 2,
      upperIndex: 5
    });
    newListType.insertAt(1, 4);
    expect(newListType.getValues()).toEqual([1, 4, 2, 3]);
    newListType.removeAt(1);
    expect(newListType.getValues()).toEqual([1, 2, 3]);
  });
});
