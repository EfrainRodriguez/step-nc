import { describe, expect, it } from 'vitest';
import { createList } from '../../src/aggregations/step-list';
import {
  hasAttribute,
  setAttribute,
} from '../../src/attributes/attribute-access';
import {
  getDerivedAttribute,
  getDerivedAttributeNames,
  hasDerivedAttribute,
} from '../../src/attributes/derived-access';
import { StepModel } from '../../src/model/step-model';
import { createRef } from '../../src/references/reference-resolver';
import { buildTestSchema } from '../fixtures/build-test-schema';

describe('DERIVED Attributes', () => {
  function setupVectorModel() {
    const schema = buildTestSchema();
    const model = new StepModel(schema);

    const { instance: dir } = model.createInstance('direction');
    setAttribute(dir!, 'name', 'Dir1');
    setAttribute(dir!, 'direction_ratios', createList([1.0, 0.0, 0.0]));

    const { instance: vector } = model.createInstance('vector');
    setAttribute(vector!, 'name', 'V1');
    setAttribute(vector!, 'orientation', createRef(dir!.id, 'DIRECTION'));
    setAttribute(vector!, 'magnitude', 10.0);

    return { schema, model, dir: dir!, vector: vector! };
  }

  it('should compute DERIVED dim attribute from SIZEOF(orientation.direction_ratios)', () => {
    const { model, vector } = setupVectorModel();

    const result = getDerivedAttribute(vector, 'dim', model);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.value).toBe(3);
  });

  it('should return undefined for non-derived attribute', () => {
    const { model, vector } = setupVectorModel();

    const result = getDerivedAttribute(vector, 'magnitude', model);
    expect(result.value).toBeUndefined();
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should report DERIVED_COMPUTATION_ERROR when computation fails', () => {
    const schema = buildTestSchema();
    const model = new StepModel(schema);

    const { instance: vector } = model.createInstance('vector');
    setAttribute(vector!, 'name', 'V-Bad');
    setAttribute(vector!, 'magnitude', 5.0);
    // orientation is not set — will cause evaluation error

    const result = getDerivedAttribute(vector!, 'dim', model);
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1);
    expect(result.diagnostics[0]!.code).toBe('DERIVED_COMPUTATION_ERROR');
  });

  it('hasDerivedAttribute should return true for DERIVED attributes', () => {
    const { vector } = setupVectorModel();
    expect(hasDerivedAttribute(vector, 'dim')).toBe(true);
  });

  it('hasDerivedAttribute should return false for explicit attributes', () => {
    const { vector } = setupVectorModel();
    expect(hasDerivedAttribute(vector, 'magnitude')).toBe(false);
  });

  it('hasAttribute should return true for both explicit and DERIVED', () => {
    const { vector } = setupVectorModel();
    expect(hasAttribute(vector, 'magnitude')).toBe(true);
    expect(hasAttribute(vector, 'dim')).toBe(true);
  });

  it('getDerivedAttributeNames should list DERIVED attributes', () => {
    const { vector } = setupVectorModel();
    const names = getDerivedAttributeNames(vector);
    expect(names).toContain('DIM');
  });

  it('setAttribute should reject writes to DERIVED attributes', () => {
    const { vector } = setupVectorModel();
    const diags = setAttribute(vector, 'dim', 5);
    expect(diags).toHaveLength(1);
    expect(diags[0]!.code).toBe('UNKNOWN_ATTRIBUTE');
    expect(diags[0]!.message).toContain('DERIVED');
  });
});
