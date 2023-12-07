import { STPSet } from '../../aggregation-data-types';
import {
  AggregationBelowLowerBoundException,
  AggregationExceededUpperBoundException,
  AggregationInvalidBoundException
} from '../../exceptions';

describe('STPSet', () => {
  test('should create an instance of STPSet and return the items with no duplicates', () => {
    const stpSet = new STPSet<number>([1, 2, 3, 2, 2]);
    expect(stpSet).toBeInstanceOf(STPSet);
    expect(stpSet.getItems()).toEqual([1, 2, 3]);
  });

  test('should empty the set', () => {
    const stpSet = new STPSet<number>([]);
    expect(stpSet.getItems()).toEqual([]);
  });

  test('should validate lower bound', () => {
    expect(() => new STPSet<number>([1, 2], 3, 5)).toThrow(
      AggregationBelowLowerBoundException
    );
  });

  test('should validate upper bound', () => {
    expect(() => new STPSet<number>([1, 2, 3, 4, 5, 6], 1, 5)).toThrow(
      AggregationExceededUpperBoundException
    );
  });

  test('should validate invalid lower bound', () => {
    expect(() => new STPSet<number>([], -1, 5)).toThrow(
      AggregationInvalidBoundException
    );
  });

  test('should validate invalid upper bound', () => {
    expect(() => new STPSet<number>([], 0, 0)).toThrow(
      AggregationInvalidBoundException
    );
  });

  test('should add and remove items', () => {
    const stpSet = new STPSet<number>([], 0, 3);
    stpSet.add(1);
    stpSet.add(2);
    expect(stpSet.getItems()).toEqual([1, 2]);
    stpSet.remove(1);
    expect(stpSet.getItems()).toEqual([2]);
  });
});
