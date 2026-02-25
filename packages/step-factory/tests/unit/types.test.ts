import { describe, expect, it } from 'vitest';
import type {
  FactoryDiagnostic,
  InstanceRef,
  SelectValue,
  StepArray,
  StepBag,
  StepList,
  StepSet,
} from '../../src';
import {
  asInstanceId,
  createFactoryDiagnostic,
  errorDiag,
  filterBySeverity,
  formatFactoryDiagnostic,
  hasFactoryErrors,
  INDETERMINATE,
  infoDiag,
  isIndeterminate,
  isInstanceRef,
  isSelectValue,
  isStepAggregation,
  warningDiag,
} from '../../src';

describe('InstanceId branded type', () => {
  it('should create an InstanceId from a number', () => {
    const id = asInstanceId(42);
    expect(id).toBe(42);
    expect(typeof id).toBe('number');
  });
});

describe('InstanceRef', () => {
  it('should be detectable with isInstanceRef', () => {
    const ref: InstanceRef = {
      kind: 'ref',
      id: asInstanceId(1),
      entityName: 'POINT',
    };
    expect(isInstanceRef(ref)).toBe(true);
    expect(isInstanceRef(42)).toBe(false);
    expect(isInstanceRef('hello')).toBe(false);
    expect(isInstanceRef(null)).toBe(false);
  });
});

describe('SelectValue', () => {
  it('should be detectable with isSelectValue', () => {
    const sv: SelectValue = {
      kind: 'select',
      typePath: ['GEOMETRIC_SELECT', 'POINT'],
      value: 'test',
    };
    expect(isSelectValue(sv)).toBe(true);
    expect(isSelectValue(42)).toBe(false);
  });
});

describe('StepAggregation types', () => {
  it('should detect StepList', () => {
    const list: StepList = { kind: 'list', elements: [1, 2, 3] };
    expect(isStepAggregation(list)).toBe(true);
    expect(list.kind).toBe('list');
    expect(list.elements).toEqual([1, 2, 3]);
  });

  it('should detect StepSet', () => {
    const set: StepSet = { kind: 'set', elements: ['a', 'b'] };
    expect(isStepAggregation(set)).toBe(true);
    expect(set.kind).toBe('set');
  });

  it('should detect StepBag', () => {
    const bag: StepBag = { kind: 'bag', elements: [1, 1, 2] };
    expect(isStepAggregation(bag)).toBe(true);
    expect(bag.kind).toBe('bag');
  });

  it('should detect StepArray', () => {
    const arr: StepArray = {
      kind: 'array',
      lowerIndex: 1,
      elements: [null, null, null],
    };
    expect(isStepAggregation(arr)).toBe(true);
    expect(arr.kind).toBe('array');
    expect(arr.lowerIndex).toBe(1);
  });

  it('should not detect non-aggregation values', () => {
    expect(isStepAggregation(42)).toBe(false);
    expect(isStepAggregation('hello')).toBe(false);
    expect(isStepAggregation(null)).toBe(false);
    expect(isStepAggregation(new Uint8Array([1]))).toBe(false);
  });
});

describe('Indeterminate', () => {
  it('should be detectable with isIndeterminate', () => {
    expect(isIndeterminate(INDETERMINATE)).toBe(true);
    expect(isIndeterminate(null)).toBe(false);
    expect(isIndeterminate(42)).toBe(false);
  });
});

describe('FactoryDiagnostic helpers', () => {
  it('should create diagnostic with createFactoryDiagnostic', () => {
    const diag = createFactoryDiagnostic(
      'error',
      'UNKNOWN_ENTITY',
      'Entity FOO not found',
      { entityName: 'FOO' },
    );
    expect(diag.severity).toBe('error');
    expect(diag.code).toBe('UNKNOWN_ENTITY');
    expect(diag.message).toBe('Entity FOO not found');
    expect(diag.entityName).toBe('FOO');
  });

  it('should create error diagnostic with errorDiag', () => {
    const diag = errorDiag('TYPE_MISMATCH', 'Expected number, got string');
    expect(diag.severity).toBe('error');
    expect(diag.code).toBe('TYPE_MISMATCH');
  });

  it('should create warning diagnostic with warningDiag', () => {
    const diag = warningDiag('BOUNDS_VIOLATION', 'Bounds check skipped');
    expect(diag.severity).toBe('warning');
  });

  it('should create info diagnostic with infoDiag', () => {
    const diag = infoDiag('BOUNDS_VIOLATION', 'Bounds OK');
    expect(diag.severity).toBe('info');
  });

  it('should detect errors with hasFactoryErrors', () => {
    const diags: FactoryDiagnostic[] = [
      infoDiag('BOUNDS_VIOLATION', 'ok'),
      errorDiag('UNKNOWN_ENTITY', 'not found'),
    ];
    expect(hasFactoryErrors(diags)).toBe(true);
    expect(hasFactoryErrors([infoDiag('BOUNDS_VIOLATION', 'ok')])).toBe(false);
  });

  it('should filter by severity', () => {
    const diags: FactoryDiagnostic[] = [
      errorDiag('UNKNOWN_ENTITY', 'a'),
      warningDiag('BOUNDS_VIOLATION', 'b'),
      errorDiag('TYPE_MISMATCH', 'c'),
    ];
    const errors = filterBySeverity(diags, 'error');
    expect(errors).toHaveLength(2);
    const warnings = filterBySeverity(diags, 'warning');
    expect(warnings).toHaveLength(1);
  });

  it('should format diagnostic', () => {
    const diag = createFactoryDiagnostic(
      'error',
      'UNKNOWN_ATTRIBUTE',
      'Attribute BAR not found',
      {
        instanceId: asInstanceId(5),
        entityName: 'POINT',
        attributeName: 'BAR',
      },
    );
    const formatted = formatFactoryDiagnostic(diag);
    expect(formatted).toContain('[ERROR]');
    expect(formatted).toContain('UNKNOWN_ATTRIBUTE');
    expect(formatted).toContain('#5');
    expect(formatted).toContain('POINT');
    expect(formatted).toContain('BAR');
  });
});
