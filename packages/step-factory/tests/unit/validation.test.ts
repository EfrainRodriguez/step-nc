import { beforeEach, describe, expect, it } from 'vitest';
import {
  StepModel,
  asInstanceId,
  createList,
  createRef,
  isInstanceComplete,
  setAttribute,
  validateInstance,
  validateModel,
} from '../../src';
import { buildTestSchema } from '../fixtures/build-test-schema';

describe('Validation', () => {
  let model: StepModel;

  beforeEach(() => {
    model = new StepModel(buildTestSchema());
  });

  describe('validateInstance', () => {
    it('should return [] for a complete and valid cartesian_point', () => {
      const { instance } = model.createInstance('cartesian_point');
      setAttribute(instance!, 'name', 'Origin');
      setAttribute(instance!, 'coordinates', createList([0.0, 0.0, 0.0]));

      const diags = validateInstance(instance!, model);
      expect(diags).toHaveLength(0);
    });

    it('should report REQUIRED_ATTRIBUTE for missing coordinates', () => {
      const { instance } = model.createInstance('cartesian_point');
      setAttribute(instance!, 'name', 'P1');

      const diags = validateInstance(instance!, model);
      const required = diags.filter((d) => d.code === 'REQUIRED_ATTRIBUTE');
      expect(required.length).toBeGreaterThanOrEqual(1);
      expect(required.some((d) => d.attributeName === 'COORDINATES')).toBe(
        true,
      );
    });

    it('should report TYPE_MISMATCH for number where string expected', () => {
      const { instance } = model.createInstance('cartesian_point');
      setAttribute(instance!, 'name', 42);
      setAttribute(instance!, 'coordinates', createList([0.0, 0.0, 0.0]));

      const diags = validateInstance(instance!, model);
      const mismatch = diags.filter((d) => d.code === 'TYPE_MISMATCH');
      expect(mismatch.length).toBeGreaterThanOrEqual(1);
      expect(mismatch.some((d) => d.attributeName === 'NAME')).toBe(true);
    });

    it('should not report diagnostic for optional attribute (colour on styled_item)', () => {
      const { instance } = model.createInstance('styled_item');
      const sv = {
        kind: 'select' as const,
        typePath: ['GEOMETRIC_SELECT', 'POINT'],
        value: createRef(asInstanceId(99), 'POINT'),
      };
      setAttribute(instance!, 'item', sv);

      const diags = validateInstance(instance!, model);
      const colourDiags = diags.filter((d) => d.attributeName === 'COLOUR');
      expect(
        colourDiags.filter((d) => d.code === 'REQUIRED_ATTRIBUTE'),
      ).toHaveLength(0);
    });

    it('should report DANGLING_REFERENCE for ref to non-existent instance', () => {
      const { instance: pt } = model.createInstance('cartesian_point');
      setAttribute(pt!, 'name', 'P1');
      setAttribute(pt!, 'coordinates', createList([1, 2, 3]));

      const { instance: dir } = model.createInstance('direction');
      setAttribute(dir!, 'name', 'D1');
      setAttribute(dir!, 'direction_ratios', createList([1, 0, 0]));

      const { instance: line } = model.createInstance('line');
      setAttribute(line!, 'name', 'L1');
      setAttribute(line!, 'pnt', createRef(pt!.id, 'CARTESIAN_POINT'));
      setAttribute(line!, 'dir', createRef(asInstanceId(999), 'DIRECTION'));

      const diags = validateInstance(line!, model);
      const dangling = diags.filter((d) => d.code === 'DANGLING_REFERENCE');
      expect(dangling.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('validateModel', () => {
    it('should return diagnostics only for the invalid instance', () => {
      const { instance: pt1 } = model.createInstance('cartesian_point');
      setAttribute(pt1!, 'name', 'P1');
      setAttribute(pt1!, 'coordinates', createList([1, 2, 3]));

      const { instance: pt2 } = model.createInstance('cartesian_point');
      setAttribute(pt2!, 'name', 'P2');
      setAttribute(pt2!, 'coordinates', createList([4, 5, 6]));

      const { instance: ptBad } = model.createInstance('cartesian_point');
      setAttribute(ptBad!, 'name', 'Bad');

      const diags = validateModel(model);
      const errors = diags.filter((d) => d.severity === 'error');
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors.every((d) => d.instanceId === ptBad!.id)).toBe(true);
    });

    it('should return only info diagnostic for all-valid model', () => {
      const { instance: pt } = model.createInstance('cartesian_point');
      setAttribute(pt!, 'name', 'P1');
      setAttribute(pt!, 'coordinates', createList([0, 0, 0]));

      const diags = validateModel(model);
      const errors = diags.filter((d) => d.severity === 'error');
      expect(errors).toHaveLength(0);

      const infos = diags.filter((d) => d.severity === 'info');
      expect(infos.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('isInstanceComplete', () => {
    it('should return false for a newly created instance', () => {
      const { instance } = model.createInstance('cartesian_point');
      expect(isInstanceComplete(instance!)).toBe(false);
    });

    it('should return true after all required attributes are set', () => {
      const { instance } = model.createInstance('cartesian_point');
      setAttribute(instance!, 'name', 'P1');
      setAttribute(instance!, 'coordinates', createList([1.0, 2.0, 3.0]));
      expect(isInstanceComplete(instance!)).toBe(true);
    });

    it('should return true even if optional attributes are not set', () => {
      const { instance: pt } = model.createInstance('cartesian_point');
      setAttribute(pt!, 'name', 'P');
      setAttribute(pt!, 'coordinates', createList([0, 0, 0]));

      const { instance: dir } = model.createInstance('direction');
      setAttribute(dir!, 'name', 'D');
      setAttribute(dir!, 'direction_ratios', createList([1, 0, 0]));

      const { instance: line } = model.createInstance('line');
      setAttribute(line!, 'name', 'L1');
      setAttribute(line!, 'pnt', createRef(pt!.id, 'CARTESIAN_POINT'));
      setAttribute(line!, 'dir', createRef(dir!.id, 'DIRECTION'));

      expect(isInstanceComplete(line!)).toBe(true);
    });
  });
});
