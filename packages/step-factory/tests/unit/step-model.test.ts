import { beforeEach, describe, expect, it } from 'vitest';
import { StepModel } from '../../src';
import { buildTestSchema } from '../fixtures/build-test-schema';

describe('StepModel', () => {
  let model: StepModel;

  beforeEach(() => {
    const schema = buildTestSchema();
    model = new StepModel(schema);
  });

  describe('createInstance', () => {
    it('should create an instance of cartesian_point with id=1', () => {
      const { instance, diagnostics } = model.createInstance('cartesian_point');
      expect(diagnostics).toHaveLength(0);
      expect(instance).toBeDefined();
      expect(instance!.id).toBe(1);
      expect(instance!.typeName).toBe('CARTESIAN_POINT');
      expect(instance!.attributes.get('COORDINATES')).toBeUndefined();
      expect(instance!.attributes.get('NAME')).toBeUndefined();
    });

    it('should assign incremental IDs', () => {
      const r1 = model.createInstance('cartesian_point');
      const r2 = model.createInstance('direction');
      const r3 = model.createInstance('colour_rgb');
      expect(r1.instance!.id).toBe(1);
      expect(r2.instance!.id).toBe(2);
      expect(r3.instance!.id).toBe(3);
    });

    it('should reject abstract entity geometric_representation_item', () => {
      const { instance, diagnostics } = model.createInstance(
        'geometric_representation_item',
      );
      expect(instance).toBeUndefined();
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]!.code).toBe('ABSTRACT_INSTANTIATION');
      expect(diagnostics[0]!.severity).toBe('error');
    });

    it('should reject abstract entity curve', () => {
      const { instance, diagnostics } = model.createInstance('curve');
      expect(instance).toBeUndefined();
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]!.code).toBe('ABSTRACT_INSTANTIATION');
    });

    it('should reject unknown entity', () => {
      const { instance, diagnostics } =
        model.createInstance('nonexistent_entity');
      expect(instance).toBeUndefined();
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]!.code).toBe('UNKNOWN_ENTITY');
      expect(diagnostics[0]!.severity).toBe('error');
    });

    it('should be case-insensitive for entity names', () => {
      const r1 = model.createInstance('Cartesian_Point');
      const r2 = model.createInstance('CARTESIAN_POINT');
      expect(r1.instance).toBeDefined();
      expect(r2.instance).toBeDefined();
      expect(r1.instance!.typeName).toBe('CARTESIAN_POINT');
      expect(r2.instance!.typeName).toBe('CARTESIAN_POINT');
    });

    it('should initialize all attributes from inheritance chain', () => {
      const { instance } = model.createInstance('cartesian_point');
      expect(instance).toBeDefined();
      expect(instance!.attributes.has('NAME')).toBe(true);
      expect(instance!.attributes.has('COORDINATES')).toBe(true);
    });
  });

  describe('getInstancesOf', () => {
    it('should return instances with subtypes by default', () => {
      model.createInstance('cartesian_point');
      model.createInstance('cartesian_point');

      const points = model.getInstancesOf('POINT');
      expect(points).toHaveLength(2);

      const gri = model.getInstancesOf('GEOMETRIC_REPRESENTATION_ITEM');
      expect(gri).toHaveLength(2);
    });

    it('should return only exact type when includeSubtypes is false', () => {
      model.createInstance('cartesian_point');
      model.createInstance('point');

      const exactPoints = model.getInstancesOf('POINT', false);
      expect(exactPoints).toHaveLength(1);
      expect(exactPoints[0]!.typeName).toBe('POINT');
    });

    it('should return empty for types with no instances', () => {
      expect(model.getInstancesOf('LINE')).toHaveLength(0);
    });
  });

  describe('deleteInstance', () => {
    it('should remove instance and decrement size', () => {
      const { instance } = model.createInstance('cartesian_point');
      expect(model.size).toBe(1);

      const deleted = model.deleteInstance(instance!.id);
      expect(deleted).toBe(true);
      expect(model.size).toBe(0);
      expect(model.getInstance(instance!.id)).toBeUndefined();
    });

    it('should return false for non-existent id', async () => {
      const { asInstanceId } = await import('../../src');
      expect(model.deleteInstance(asInstanceId(999))).toBe(false);
    });

    it('should remove from type index', () => {
      const { instance } = model.createInstance('cartesian_point');
      model.deleteInstance(instance!.id);
      expect(model.getInstancesOf('CARTESIAN_POINT')).toHaveLength(0);
      expect(model.getInstancesOf('POINT')).toHaveLength(0);
    });
  });

  describe('createInstanceWithId', () => {
    it('should create instance with explicit id', () => {
      const { instance, diagnostics } = model.createInstanceWithId(
        42,
        'cartesian_point',
      );
      expect(diagnostics).toHaveLength(0);
      expect(instance).toBeDefined();
      expect(instance!.id).toBe(42);
    });

    it('should reject duplicate id', () => {
      model.createInstanceWithId(42, 'cartesian_point');
      const { instance, diagnostics } = model.createInstanceWithId(
        42,
        'direction',
      );
      expect(instance).toBeUndefined();
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]!.code).toBe('DUPLICATE_INSTANCE_ID');
    });

    it('should advance auto-increment counter past explicit id', () => {
      model.createInstanceWithId(10, 'cartesian_point');
      const { instance } = model.createInstance('direction');
      expect(instance!.id).toBe(11);
    });
  });

  describe('size and getAllInstances', () => {
    it('should report correct size', () => {
      expect(model.size).toBe(0);
      model.createInstance('cartesian_point');
      expect(model.size).toBe(1);
      model.createInstance('direction');
      expect(model.size).toBe(2);
    });

    it('should return all instances', () => {
      model.createInstance('cartesian_point');
      model.createInstance('direction');
      const all = model.getAllInstances();
      expect(all).toHaveLength(2);
    });
  });

  describe('getEntityDefinition', () => {
    it('should return definition for existing entity', () => {
      const def = model.getEntityDefinition('cartesian_point');
      expect(def).toBeDefined();
      expect(def!.name).toBe('cartesian_point');
    });

    it('should return undefined for unknown entity', () => {
      expect(model.getEntityDefinition('nonexistent')).toBeUndefined();
    });
  });
});
