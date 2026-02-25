import { describe, expect, it, vi } from 'vitest';
import { createList } from '../../src/aggregations/step-list';
import { setAttribute } from '../../src/attributes/attribute-access';
import { getDerivedAttribute } from '../../src/attributes/derived-access';
import * as evaluateModule from '../../src/interpreter/evaluate';
import { StepModel } from '../../src/model/step-model';
import { createRef } from '../../src/references/reference-resolver';
import { buildTestSchema } from '../fixtures/build-test-schema';

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

describe('DERIVED Attribute Cache', () => {
  it('_derivedCache is initialized as empty Map on new instance', () => {
    const { vector } = setupVectorModel();
    expect(vector._derivedCache).toBeInstanceOf(Map);
    expect(vector._derivedCache.size).toBe(0);
  });

  it('getDerivedAttribute caches result on first call', () => {
    const { model, vector } = setupVectorModel();
    getDerivedAttribute(vector, 'dim', model);
    expect(vector._derivedCache.has('DIM')).toBe(true);
    expect(vector._derivedCache.get('DIM')).toBe(3);
  });

  it('getDerivedAttribute returns cached value on second call without re-evaluating', () => {
    const { model, vector } = setupVectorModel();

    // Populate cache
    getDerivedAttribute(vector, 'dim', model);

    // Spy on evaluate AFTER cache is warm
    const spy = vi.spyOn(evaluateModule, 'evaluate');

    // Second call should hit the cache
    const result2 = getDerivedAttribute(vector, 'dim', model);
    expect(spy).not.toHaveBeenCalled();
    expect(result2.value).toBe(3);

    spy.mockRestore();
  });

  it('setAttribute invalidates the derived cache', () => {
    const { model, vector } = setupVectorModel();

    // Warm the cache
    getDerivedAttribute(vector, 'dim', model);
    expect(vector._derivedCache.size).toBe(1);

    // setAttribute should clear the cache
    setAttribute(vector, 'magnitude', 20.0);
    expect(vector._derivedCache.size).toBe(0);
  });

  it('getDerivedAttribute re-evaluates after cache invalidation', () => {
    const { model, vector } = setupVectorModel();

    // First call: evaluates and caches
    const r1 = getDerivedAttribute(vector, 'dim', model);
    expect(r1.value).toBe(3);

    // Invalidate cache via setAttribute
    setAttribute(vector, 'magnitude', 20.0);

    // Second call: re-evaluates (cache was cleared)
    const r2 = getDerivedAttribute(vector, 'dim', model);
    expect(r2.value).toBe(3); // same value (dim depends on direction_ratios, not magnitude)
    expect(vector._derivedCache.has('DIM')).toBe(true); // re-cached
  });

  it('cache is separate per instance', () => {
    const schema = buildTestSchema();
    const model = new StepModel(schema);

    const { instance: dir1 } = model.createInstance('direction');
    setAttribute(dir1!, 'name', 'Dir1');
    setAttribute(dir1!, 'direction_ratios', createList([1.0, 0.0, 0.0]));

    const { instance: dir2 } = model.createInstance('direction');
    setAttribute(dir2!, 'name', 'Dir2');
    setAttribute(dir2!, 'direction_ratios', createList([1.0, 0.0, 0.0]));

    const { instance: v1 } = model.createInstance('vector');
    setAttribute(v1!, 'name', 'V1');
    setAttribute(v1!, 'orientation', createRef(dir1!.id, 'DIRECTION'));
    setAttribute(v1!, 'magnitude', 1.0);

    const { instance: v2 } = model.createInstance('vector');
    setAttribute(v2!, 'name', 'V2');
    setAttribute(v2!, 'orientation', createRef(dir2!.id, 'DIRECTION'));
    setAttribute(v2!, 'magnitude', 2.0);

    getDerivedAttribute(v1!, 'dim', model);
    expect(v1!._derivedCache.has('DIM')).toBe(true);
    expect(v2!._derivedCache.has('DIM')).toBe(false); // v2 cache not touched
  });
});
