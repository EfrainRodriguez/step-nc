import { beforeEach, describe, expect, it } from 'vitest';
import type { StepList } from '../../src';
import {
  StepModel,
  getAttribute,
  getAttributeNames,
  getUnsetRequiredAttributes,
  hasAttribute,
  setAttribute,
  setAttributes,
} from '../../src';
import { buildTestSchema } from '../fixtures/build-test-schema';

describe('Attribute access', () => {
  let model: StepModel;

  beforeEach(() => {
    model = new StepModel(buildTestSchema());
  });

  describe('setAttribute / getAttribute', () => {
    it('should set and get a simple string attribute', () => {
      const { instance } = model.createInstance('cartesian_point');
      const diags = setAttribute(instance!, 'name', 'Origin');
      expect(diags).toHaveLength(0);
      expect(getAttribute(instance!, 'name')).toBe('Origin');
    });

    it('should set LIST attribute on cartesian_point', () => {
      const { instance } = model.createInstance('cartesian_point');
      const list: StepList = { kind: 'list', elements: [1.0, 2.0, 3.0] };
      const diags = setAttribute(instance!, 'coordinates', list);
      expect(diags).toHaveLength(0);
      expect(getAttribute(instance!, 'coordinates')).toEqual(list);
    });

    it('should return TYPE_MISMATCH for incompatible value when schema provided', () => {
      const { instance } = model.createInstance('cartesian_point');
      const diags = setAttribute(
        instance!,
        'coordinates',
        'not-a-list',
        model.schema,
      );
      expect(diags).toHaveLength(1);
      expect(diags[0]!.code).toBe('TYPE_MISMATCH');
    });

    it('should return UNKNOWN_ATTRIBUTE for non-existent attribute', () => {
      const { instance } = model.createInstance('cartesian_point');
      const diags = setAttribute(instance!, 'foo', 42);
      expect(diags).toHaveLength(1);
      expect(diags[0]!.code).toBe('UNKNOWN_ATTRIBUTE');
    });

    it('should return undefined for unset attribute', () => {
      const { instance } = model.createInstance('cartesian_point');
      expect(getAttribute(instance!, 'coordinates')).toBeUndefined();
    });

    it('should set inherited attribute (name from geometric_representation_item)', () => {
      const { instance } = model.createInstance('line');
      const diags = setAttribute(instance!, 'name', 'My Line');
      expect(diags).toHaveLength(0);
      expect(getAttribute(instance!, 'name')).toBe('My Line');
    });

    it('should be case-insensitive', () => {
      const { instance } = model.createInstance('cartesian_point');
      setAttribute(instance!, 'Name', 'Test');
      expect(getAttribute(instance!, 'NAME')).toBe('Test');
      expect(getAttribute(instance!, 'name')).toBe('Test');
    });
  });

  describe('hasAttribute', () => {
    it('should return true for existing attribute', () => {
      const { instance } = model.createInstance('cartesian_point');
      expect(hasAttribute(instance!, 'name')).toBe(true);
      expect(hasAttribute(instance!, 'coordinates')).toBe(true);
    });

    it('should return false for non-existent attribute', () => {
      const { instance } = model.createInstance('cartesian_point');
      expect(hasAttribute(instance!, 'foo')).toBe(false);
    });
  });

  describe('getAttributeNames', () => {
    it('should return all attribute names', () => {
      const { instance } = model.createInstance('cartesian_point');
      const names = getAttributeNames(instance!);
      expect(names).toContain('NAME');
      expect(names).toContain('COORDINATES');
    });
  });

  describe('getUnsetRequiredAttributes', () => {
    it('should return all required attributes for a new instance', () => {
      const { instance } = model.createInstance('cartesian_point');
      const unset = getUnsetRequiredAttributes(instance!);
      expect(unset).toContain('NAME');
      expect(unset).toContain('COORDINATES');
    });

    it('should return empty after all required are assigned', () => {
      const { instance } = model.createInstance('cartesian_point');
      setAttribute(instance!, 'name', 'P1');
      const list: StepList = { kind: 'list', elements: [0.0, 0.0, 0.0] };
      setAttribute(instance!, 'coordinates', list);
      const unset = getUnsetRequiredAttributes(instance!);
      expect(unset).toHaveLength(0);
    });

    it('should not include optional attributes as unset required', () => {
      const { instance } = model.createInstance('line');
      const unset = getUnsetRequiredAttributes(instance!);
      expect(unset).not.toContain('MAGNITUDE');
      expect(unset).toContain('NAME');
      expect(unset).toContain('PNT');
      expect(unset).toContain('DIR');
    });
  });

  describe('setAttributes (bulk)', () => {
    it('should set multiple attributes at once', () => {
      const { instance } = model.createInstance('colour_rgb');
      const diags = setAttributes(instance!, {
        red: 1.0,
        green: 0.5,
        blue: 0.0,
      });
      expect(diags).toHaveLength(0);
      expect(getAttribute(instance!, 'RED')).toBe(1.0);
      expect(getAttribute(instance!, 'GREEN')).toBe(0.5);
      expect(getAttribute(instance!, 'BLUE')).toBe(0.0);
    });

    it('should report diagnostics only for invalid attributes', () => {
      const { instance } = model.createInstance('colour_rgb');
      const diags = setAttributes(instance!, {
        red: 1.0,
        nonexistent: 42,
        blue: 0.0,
      });
      expect(diags).toHaveLength(1);
      expect(diags[0]!.code).toBe('UNKNOWN_ATTRIBUTE');
      expect(getAttribute(instance!, 'RED')).toBe(1.0);
      expect(getAttribute(instance!, 'BLUE')).toBe(0.0);
    });
  });
});
