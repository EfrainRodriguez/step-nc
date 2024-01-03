import { SetType } from '../../aggregation-data-types';
import {
  AggregationTypeLowerIndexMustBeLessThanUpperIndexException,
  AggregationTypeInvalidBoundException
} from '../../exceptions';

describe('SetType', () => {
  const newSetType = new SetType<number>({ values: [1, 2, 3, 2, 2] });
  test('should create an instance of SetType and return the items with no duplicates', () => {
    expect(newSetType).toBeInstanceOf(SetType);
    expect(newSetType.getValues()).toEqual([1, 2, 3]);
  });

  test('should return a item by value', () => {
    expect(newSetType.get(2)).toEqual(2);
  });

  test('should empty the set', () => {
    const newSetType = new SetType<number>({ values: [] });
    expect(newSetType.getValues()).toEqual([]);
  });

  test('should throws an error if lower bound is greater than upper bound', () => {
    expect(
      () =>
        new SetType<number>({
          values: [1, 2, 3],
          lowerIndex: 3,
          upperIndex: 2
        })
    ).toThrow(AggregationTypeLowerIndexMustBeLessThanUpperIndexException);
  });

  test('should throws an error if the bounds are invalid', () => {
    expect(
      () => new SetType<number>({ values: [1, 2, 3], lowerIndex: NaN })
    ).toThrow(AggregationTypeInvalidBoundException);
    expect(
      () => new SetType<number>({ values: [1, 2, 3], upperIndex: NaN })
    ).toThrow(AggregationTypeInvalidBoundException);
  });

  test('should add and remove items', () => {
    const newSetType = new SetType<number>({ values: [] });
    newSetType.add(1);
    newSetType.add(2);
    expect(newSetType.getValues()).toEqual([1, 2]);
    newSetType.remove(1);
    expect(newSetType.getValues()).toEqual([2]);
  });

  test('should validate min and max length', () => {
    const newSetType = new SetType<number>({
      values: [1, 2, 3],
      lowerIndex: 3,
      upperIndex: 5
    });
    expect(() => newSetType.setValues([0, 1])).toThrow(
      AggregationTypeInvalidBoundException
    );
    expect(() => newSetType.setValues([0, 1, 2, 3, 4, 5])).toThrow(
      AggregationTypeInvalidBoundException
    );
  });
});
