import type { AggregationTypeDescriptor } from '@step-nc/express-dictionary';
import type { IntegerLiteralNode } from '@step-nc/express-parser';
import { describe, expect, it } from 'vitest';
import {
  addToAggregation,
  aggregationElements,
  aggregationSize,
  createArray,
  createBag,
  createList,
  createSet,
  removeFromAggregation,
  validateAggregationBounds,
} from '../../src';

function intLiteral(value: number): IntegerLiteralNode {
  return {
    type: 'IntegerLiteral',
    value,
    span: {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 0, line: 1, column: 1 },
    },
  };
}

describe('createList', () => {
  it('should create list with elements', () => {
    const list = createList([1, 2, 3]);
    expect(list.kind).toBe('list');
    expect(list.elements).toEqual([1, 2, 3]);
  });

  it('should create empty list', () => {
    const list = createList();
    expect(list.elements).toEqual([]);
  });
});

describe('createSet', () => {
  it('should create set deduplicating primitives', () => {
    const set = createSet([1, 2, 2, 3, 3]);
    expect(set.kind).toBe('set');
    expect(set.elements).toEqual([1, 2, 3]);
  });
});

describe('createBag', () => {
  it('should create bag allowing duplicates', () => {
    const bag = createBag([1, 1, 2]);
    expect(bag.kind).toBe('bag');
    expect(bag.elements).toEqual([1, 1, 2]);
  });
});

describe('createArray', () => {
  it('should create array with null slots', () => {
    const arr = createArray(1, 3);
    expect(arr.kind).toBe('array');
    expect(arr.lowerIndex).toBe(1);
    expect(arr.elements).toEqual([null, null, null]);
  });
});

describe('addToAggregation', () => {
  it('should append to LIST', () => {
    const list = createList([1, 2]);
    const result = addToAggregation(list, 3);
    expect(result.elements).toEqual([1, 2, 3]);
    expect(list.elements).toEqual([1, 2]);
  });

  it('should deduplicate on SET', () => {
    const set = createSet([1, 2]);
    const result = addToAggregation(set, 2);
    expect(result.elements).toEqual([1, 2]);
  });

  it('should add unique value to SET', () => {
    const set = createSet([1, 2]);
    const result = addToAggregation(set, 3);
    expect(result.elements).toEqual([1, 2, 3]);
  });

  it('should allow duplicates in BAG', () => {
    const bag = createBag([1, 2]);
    const result = addToAggregation(bag, 2);
    expect(result.elements).toEqual([1, 2, 2]);
  });

  it('should not modify ARRAY', () => {
    const arr = createArray(0, 3);
    const result = addToAggregation(arr, 42);
    expect(result).toBe(arr);
  });
});

describe('removeFromAggregation', () => {
  it('should remove from LIST by index', () => {
    const list = createList([10, 20, 30]);
    const result = removeFromAggregation(list, 1);
    expect(result.elements).toEqual([10, 30]);
    expect(list.elements).toEqual([10, 20, 30]);
  });

  it('should set null in ARRAY at index', () => {
    const arr = createArray(0, 3);
    expect(removeFromAggregation(arr, 1).elements).toEqual([null, null, null]);
  });
});

describe('aggregationSize / aggregationElements', () => {
  it('should return size', () => {
    expect(aggregationSize(createList([1, 2, 3]))).toBe(3);
  });

  it('should return elements', () => {
    expect(aggregationElements(createList([1, 2]))).toEqual([1, 2]);
  });
});

describe('validateAggregationBounds', () => {
  it('should pass for valid bounds', () => {
    const list = createList([1, 2]);
    const descriptor: AggregationTypeDescriptor = {
      kind: 'aggregation',
      aggregationKind: 'LIST',
      bounds: { lower: intLiteral(1), upper: intLiteral(3) },
      elementType: { kind: 'simple', simpleType: 'REAL' },
    };
    expect(validateAggregationBounds(list, descriptor)).toBeUndefined();
  });

  it('should fail for too few elements', () => {
    const list = createList([]);
    const descriptor: AggregationTypeDescriptor = {
      kind: 'aggregation',
      aggregationKind: 'LIST',
      bounds: { lower: intLiteral(1), upper: intLiteral(3) },
      elementType: { kind: 'simple', simpleType: 'REAL' },
    };
    const diag = validateAggregationBounds(list, descriptor);
    expect(diag).toBeDefined();
    expect(diag!.code).toBe('BOUNDS_VIOLATION');
  });

  it('should pass for unbounded upper (undefined upper expression)', () => {
    const set = createSet([1, 2, 3, 4, 5]);
    const descriptor: AggregationTypeDescriptor = {
      kind: 'aggregation',
      aggregationKind: 'SET',
      bounds: { lower: intLiteral(1) },
      elementType: { kind: 'simple', simpleType: 'REAL' },
    };
    expect(validateAggregationBounds(set, descriptor)).toBeUndefined();
  });

  it('should pass without bounds', () => {
    const list = createList([1]);
    const descriptor: AggregationTypeDescriptor = {
      kind: 'aggregation',
      aggregationKind: 'LIST',
      elementType: { kind: 'simple', simpleType: 'REAL' },
    };
    expect(validateAggregationBounds(list, descriptor)).toBeUndefined();
  });
});
