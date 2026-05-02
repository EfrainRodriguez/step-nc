import type { SelectTypeDescriptor } from '@step-nc/express-dictionary';
import { getType } from '@step-nc/express-dictionary';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SelectValue } from '../../src';
import {
  asInstanceId,
  createSelectValue,
  getSelectActualValue,
  getSelectTypePath,
  StepModel,
  validateSelectValue,
} from '../../src';
import { buildTestSchema } from '../fixtures/build-test-schema';

describe('SELECT types', () => {
  let model: StepModel;

  beforeEach(() => {
    model = new StepModel(buildTestSchema());
  });

  describe('createSelectValue', () => {
    it('should create SelectValue with UPPERCASE typePath', () => {
      const sv = createSelectValue(['geometric_select', 'point'], 'test-value');
      expect(sv.kind).toBe('select');
      expect(sv.typePath).toEqual(['GEOMETRIC_SELECT', 'POINT']);
      expect(sv.value).toBe('test-value');
    });

    it('should normalize mixed case typePath', () => {
      const sv = createSelectValue(['Geometric_Select', 'Line'], 42);
      expect(sv.typePath).toEqual(['GEOMETRIC_SELECT', 'LINE']);
    });
  });

  describe('validateSelectValue', () => {
    it('should pass for valid select path', () => {
      const typeDef = getType(model.schema, 'geometric_select')!;
      const descriptor = typeDef.underlyingType as SelectTypeDescriptor;

      const sv = createSelectValue(['GEOMETRIC_SELECT', 'POINT'], {
        kind: 'ref',
        id: asInstanceId(1),
        entityName: 'POINT',
      });

      const diags = validateSelectValue(sv, descriptor, model.schema);
      expect(diags).toHaveLength(0);
    });

    it('should fail for invalid select path', () => {
      const typeDef = getType(model.schema, 'geometric_select')!;
      const descriptor = typeDef.underlyingType as SelectTypeDescriptor;

      const sv = createSelectValue(['GEOMETRIC_SELECT', 'COLOUR_RGB'], 42);

      const diags = validateSelectValue(sv, descriptor, model.schema);
      expect(diags).toHaveLength(1);
      expect(diags[0]!.code).toBe('INVALID_SELECT_PATH');
    });

    it('should fail for typePath with less than 2 elements', () => {
      const typeDef = getType(model.schema, 'geometric_select')!;
      const descriptor = typeDef.underlyingType as SelectTypeDescriptor;

      const sv: SelectValue = {
        kind: 'select',
        typePath: ['POINT'],
        value: 42,
      };

      const diags = validateSelectValue(sv, descriptor, model.schema);
      expect(diags).toHaveLength(1);
      expect(diags[0]!.code).toBe('INVALID_SELECT_PATH');
    });
  });

  describe('getSelectActualValue / getSelectTypePath', () => {
    it('should return value and typePath', () => {
      const sv = createSelectValue(['GEOMETRIC_SELECT', 'DIRECTION'], 99);
      expect(getSelectActualValue(sv)).toBe(99);
      expect(getSelectTypePath(sv)).toEqual(['GEOMETRIC_SELECT', 'DIRECTION']);
    });
  });
});
