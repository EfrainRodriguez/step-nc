import { BagType } from '../../aggregation-data-types';
import {
  AggregationTypeLowerIndexMustBeLessThanUpperIndexException,
  AggregationTypeInvalidBoundException
} from '../../exceptions';

describe('BagType', () => {
  const newBagType = new BagType<number>({ values: [1, 2, 3] });
  test('should create an instance of BagType and return the items', () => {
    expect(newBagType).toBeInstanceOf(BagType);
    expect(newBagType.getValues()).toEqual([1, 2, 3]);
  });

  test('should return a item by value', () => {
    expect(newBagType.get(2)).toEqual(2);
  });

  test('should empty the bag', () => {
    const newBagType = new BagType<number>({ values: [] });
    expect(newBagType.getValues()).toEqual([]);
  });

  test('should throws an error if lower bound is greater than upper bound', () => {
    expect(
      () =>
        new BagType<number>({
          values: [1, 2, 3],
          lowerIndex: 3,
          upperIndex: 2
        })
    ).toThrow(AggregationTypeLowerIndexMustBeLessThanUpperIndexException);
  });

  test('should throws an error if the bounds are invalid', () => {
    expect(
      () => new BagType<number>({ values: [1, 2, 3], lowerIndex: NaN })
    ).toThrow(AggregationTypeInvalidBoundException);
    expect(
      () => new BagType<number>({ values: [1, 2, 3], upperIndex: NaN })
    ).toThrow(AggregationTypeInvalidBoundException);
  });

  test('should add and remove items', () => {
    const newBagType = new BagType<number>({ values: [] });
    newBagType.add(1);
    newBagType.add(2);
    expect(newBagType.getValues()).toEqual([1, 2]);
    newBagType.remove(1);
    expect(newBagType.getValues()).toEqual([2]);
  });

  test('should validate min and max length', () => {
    const newBagType = new BagType<number>({
      values: [1, 2, 3],
      lowerIndex: 3,
      upperIndex: 5
    });
    expect(() => newBagType.setValues([0, 1])).toThrow(
      AggregationTypeInvalidBoundException
    );
    expect(() => newBagType.setValues([0, 1, 2, 3, 4, 5])).toThrow(
      AggregationTypeInvalidBoundException
    );
  });
});
