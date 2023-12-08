import { STPBag } from '../../aggregation-data-types';
import {
  AggregationBelowLowerBoundException,
  AggregationExceededUpperBoundException,
  AggregationInvalidBoundException
} from '../../exceptions';

describe('STPBag', () => {
  test('should create an instance of STPBag and return the items', () => {
    const stpBag = new STPBag<number>([1, 2, 3]);
    expect(stpBag).toBeInstanceOf(STPBag);
    expect(stpBag.getItems()).toEqual([1, 2, 3]);
  });

  test('should return a item by value', () => {
    const stpBag = new STPBag<number>([1, 2, 3]);
    expect(stpBag.get(2)).toEqual(2);
  });

  test('should empty the bag', () => {
    const stpBag = new STPBag<number>([]);
    expect(stpBag.getItems()).toEqual([]);
  });

  test('should validate lower bound', () => {
    expect(() => new STPBag<number>([1, 2], 3, 5)).toThrow(
      AggregationBelowLowerBoundException
    );
  });

  test('should validate upper bound', () => {
    expect(() => new STPBag<number>([1, 2, 3, 4, 5, 6], 1, 5)).toThrow(
      AggregationExceededUpperBoundException
    );
  });

  test('should validate invalid lower bound', () => {
    expect(() => new STPBag<number>([], -1, 5)).toThrow(
      AggregationInvalidBoundException
    );
  });

  test('should validate invalid upper bound', () => {
    expect(() => new STPBag<number>([10], 1, 0)).toThrow(
      AggregationInvalidBoundException
    );
  });

  test('should add and remove items', () => {
    const stpBag = new STPBag<number>([]);
    stpBag.add(1);
    stpBag.add(2);
    expect(stpBag.getItems()).toEqual([1, 2]);
    stpBag.remove(1);
    expect(stpBag.getItems()).toEqual([2]);
  });
});
