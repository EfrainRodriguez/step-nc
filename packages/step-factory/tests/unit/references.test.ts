import { beforeEach, describe, expect, it } from 'vitest';
import {
  StepModel,
  asInstanceId,
  createList,
  createRef,
  findReferencesTo,
  resolveRef,
  setAttribute,
  validateReferences,
} from '../../src';
import { buildTestSchema } from '../fixtures/build-test-schema';

describe('References', () => {
  let model: StepModel;

  beforeEach(() => {
    model = new StepModel(buildTestSchema());
  });

  describe('createRef', () => {
    it('should normalize entityName to UPPERCASE', () => {
      const ref = createRef(asInstanceId(1), 'cartesian_point');
      expect(ref.entityName).toBe('CARTESIAN_POINT');
      expect(ref.id).toBe(1);
      expect(ref.kind).toBe('ref');
    });
  });

  describe('resolveRef', () => {
    it('should resolve existing instance', () => {
      const { instance } = model.createInstance('cartesian_point');
      const ref = createRef(instance!.id, 'cartesian_point');
      const resolved = resolveRef(model, ref);
      expect(resolved).toBe(instance);
    });

    it('should return undefined for non-existent ref', () => {
      const ref = createRef(asInstanceId(999), 'cartesian_point');
      expect(resolveRef(model, ref)).toBeUndefined();
    });
  });

  describe('validateReferences', () => {
    it('should return empty for clean model', () => {
      const { instance: pt } = model.createInstance('cartesian_point');
      setAttribute(pt!, 'name', 'P1');
      setAttribute(pt!, 'coordinates', createList([0, 0, 0]));

      const diags = validateReferences(model);
      expect(diags).toHaveLength(0);
    });

    it('should detect dangling reference', () => {
      const { instance: line } = model.createInstance('line');
      setAttribute(line!, 'name', 'L1');

      const danglingRef = createRef(asInstanceId(999), 'cartesian_point');
      setAttribute(line!, 'pnt', danglingRef);

      const diags = validateReferences(model);
      expect(diags.length).toBeGreaterThanOrEqual(1);
      const dangling = diags.find((d) => d.code === 'DANGLING_REFERENCE');
      expect(dangling).toBeDefined();
      expect(dangling!.instanceId).toBe(line!.id);
      expect(dangling!.attributeName).toBe('PNT');
    });
  });

  describe('findReferencesTo', () => {
    it('should find instances referencing a target', () => {
      const { instance: pt } = model.createInstance('cartesian_point');
      setAttribute(pt!, 'name', 'P1');
      setAttribute(pt!, 'coordinates', createList([1, 2, 3]));

      const { instance: dir } = model.createInstance('direction');
      setAttribute(dir!, 'name', 'D1');
      setAttribute(dir!, 'direction_ratios', createList([1, 0, 0]));

      const { instance: line } = model.createInstance('line');
      setAttribute(line!, 'name', 'L1');
      setAttribute(line!, 'pnt', createRef(pt!.id, 'cartesian_point'));
      setAttribute(line!, 'dir', createRef(dir!.id, 'direction'));

      const refs = findReferencesTo(model, pt!.id);
      expect(refs).toHaveLength(1);
      expect(refs[0]!.instance.id).toBe(line!.id);
      expect(refs[0]!.attributeName).toBe('PNT');
    });
  });

  describe('Subtype compatibility for refs', () => {
    it('should accept ref to subtype when supertype expected via isValueCompatible', async () => {
      const { isValueCompatible } = await import('../../src');
      const schema = buildTestSchema();

      const ref = createRef(asInstanceId(1), 'CARTESIAN_POINT');

      const pntDescriptor = {
        kind: 'entity' as const,
        entity: { name: 'cartesian_point' },
      };

      expect(isValueCompatible(pntDescriptor, ref, schema)).toBe(true);
    });
  });
});
