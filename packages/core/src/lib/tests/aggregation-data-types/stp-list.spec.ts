import { STPList } from '../../aggregation-data-types';
import {
  AggregationBelowLowerBoundException,
  AggregationExceededUpperBoundException,
  AggregationInvalidBoundException
} from '../../exceptions';

describe('STPList', () => {
  test('should create an instance of STPList and return the items', () => {
    const stpList = new STPList<number>([1, 2, 3]);
    expect(stpList).toBeInstanceOf(STPList);
    expect(stpList.getItems()).toEqual([1, 2, 3]);
  });

  test('should validate unique properties', () => {
    const stpList = new STPList<number>([1, 1, 2], 1, 5, true);
    expect(stpList.getItems()).toEqual([1, 2]);
  });

  test('should validate lower bound', () => {
    expect(() => new STPList<number>([1, 2], 3, 5)).toThrow(
      AggregationBelowLowerBoundException
    );
  });

  test('should validate upper bound', () => {
    expect(() => new STPList<number>([1, 2, 3, 4, 5, 6], 1, 5)).toThrow(
      AggregationExceededUpperBoundException
    );
  });

  test('should validate invalid lower bound', () => {
    expect(() => new STPList<number>([], -1, 5)).toThrow(
      AggregationInvalidBoundException
    );
  });

  test('should validate invalid upper bound', () => {
    expect(() => new STPList<number>([10], 1, 0)).toThrow(
      AggregationInvalidBoundException
    );
  });

  test('should add and remove items', () => {
    const stpList = new STPList<number>([]);
    stpList.add(1);
    stpList.add(2);
    expect(stpList.getItems()).toEqual([1, 2]);
    stpList.remove(1);
    expect(stpList.getItems()).toEqual([2]);
  });

  test('should insert and remove at index', () => {
    const stpList = new STPList<number>([1, 2, 3]);
    stpList.insertAt(1, 4);
    expect(stpList.getItems()).toEqual([1, 4, 2, 3]);
    stpList.removeAt(1);
    expect(stpList.getItems()).toEqual([1, 2, 3]);
  });
});
