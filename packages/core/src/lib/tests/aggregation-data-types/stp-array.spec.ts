import { STPArray } from '../../aggregation-data-types';
import {
  AggregationBelowLowerBoundException,
  AggregationExceededUpperBoundException,
  AggregationInvalidBoundException
} from '../../exceptions';

describe('STPArray', () => {
  test('should create an instance of STPArray and return the items', () => {
    const stpArray = new STPArray<number>([1, 2, 3], 2, 5, false, false);
    expect(stpArray).toBeInstanceOf(STPArray);
    expect(stpArray.getItems()).toEqual([1, 2, 3]);
  });

  test('should empty the array', () => {
    const stpArray = new STPArray<number>([], 0, 5, false, false);
    expect(stpArray.getItems()).toEqual([]);
  });

  test('should validate unique and optional properties', () => {
    const stpArray = new STPArray<number>(
      [1, 1, 2, undefined as unknown as number],
      1,
      5,
      true,
      true
    );
    expect(stpArray.getItems()).toEqual([1, 2]);
  });

  test('should validate lower bound', () => {
    expect(() => new STPArray<number>([1, 2], 3, 5)).toThrow(
      AggregationBelowLowerBoundException
    );
  });

  test('should validate upper bound', () => {
    expect(() => new STPArray<number>([1, 2, 3, 4, 5, 6], 1, 5)).toThrow(
      AggregationExceededUpperBoundException
    );
  });

  test('should validate invalid lower bound', () => {
    expect(() => new STPArray<number>([], -1, 5, false, false)).toThrow(
      AggregationInvalidBoundException
    );
  });

  test('should validate invalid upper bound', () => {
    expect(() => new STPArray<number>([], 1, 0, false, false)).toThrow(
      AggregationInvalidBoundException
    );
  });

  test('should add and remove items', () => {
    const stpArray = new STPArray<number>([], 0, 3, false, false);
    stpArray.add(1);
    stpArray.add(2);
    expect(stpArray.getItems()).toEqual([1, 2]);
    stpArray.remove(1);
    expect(stpArray.getItems()).toEqual([2]);
  });

  test('should insert and remove at index', () => {
    const stpArray = new STPArray<number>([1, 2, 3], 0, 5, false, false);
    stpArray.insertAt(1, 4);
    expect(stpArray.getItems()).toEqual([1, 4, 2, 3]);
    stpArray.removeAt(1);
    expect(stpArray.getItems()).toEqual([1, 2, 3]);
  });
});
