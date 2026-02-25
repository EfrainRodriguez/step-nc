import { describe, expect, it } from 'vitest';
import { setAttribute } from '../../src/attributes/attribute-access';
import { StepModel } from '../../src/model/step-model';
import { createRef } from '../../src/references/reference-resolver';
import { validateModel } from '../../src/validation/validate-model';
import { validateUniqueRules } from '../../src/validation/validate-unique-rules';
import { buildTestSchema } from '../fixtures/build-test-schema';

describe('UNIQUE Rules Validation', () => {
  describe('validateUniqueRules', () => {
    it('should pass when named_unit instances have different names', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance: u1 } = model.createInstance('named_unit');
      setAttribute(u1!, 'name', 'meter');
      setAttribute(u1!, 'symbol', 'm');

      const { instance: u2 } = model.createInstance('named_unit');
      setAttribute(u2!, 'name', 'kilogram');
      setAttribute(u2!, 'symbol', 'kg');

      const diags = validateUniqueRules(model);
      const violations = diags.filter((d) => d.code === 'UNIQUE_VIOLATION');
      expect(violations).toHaveLength(0);
    });

    it('should fail when named_unit instances have the same name', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance: u1 } = model.createInstance('named_unit');
      setAttribute(u1!, 'name', 'meter');
      setAttribute(u1!, 'symbol', 'm');

      const { instance: u2 } = model.createInstance('named_unit');
      setAttribute(u2!, 'name', 'meter');
      setAttribute(u2!, 'symbol', 'mt');

      const diags = validateUniqueRules(model);
      const violations = diags.filter((d) => d.code === 'UNIQUE_VIOLATION');
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations[0]!.message).toContain('ur1');
    });

    it('should pass compound unique when different combinations', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance: u1 } = model.createInstance('named_unit');
      setAttribute(u1!, 'name', 'meter');
      setAttribute(u1!, 'symbol', 'm');

      const { instance: u2 } = model.createInstance('named_unit');
      setAttribute(u2!, 'name', 'kilogram');
      setAttribute(u2!, 'symbol', 'kg');

      const { instance: pv1 } = model.createInstance('property_value');
      setAttribute(pv1!, 'property_name', 'length');
      setAttribute(pv1!, 'unit', createRef(u1!.id, 'NAMED_UNIT'));
      setAttribute(pv1!, 'value', 10.0);

      const { instance: pv2 } = model.createInstance('property_value');
      setAttribute(pv2!, 'property_name', 'length');
      setAttribute(pv2!, 'unit', createRef(u2!.id, 'NAMED_UNIT'));
      setAttribute(pv2!, 'value', 20.0);

      const diags = validateUniqueRules(model);
      const pvViolations = diags.filter(
        (d) =>
          d.code === 'UNIQUE_VIOLATION' && d.entityName === 'PROPERTY_VALUE',
      );
      expect(pvViolations).toHaveLength(0);
    });

    it('should fail compound unique when same combination', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance: unit } = model.createInstance('named_unit');
      setAttribute(unit!, 'name', 'meter');
      setAttribute(unit!, 'symbol', 'm');

      const { instance: pv1 } = model.createInstance('property_value');
      setAttribute(pv1!, 'property_name', 'length');
      setAttribute(pv1!, 'unit', createRef(unit!.id, 'NAMED_UNIT'));
      setAttribute(pv1!, 'value', 10.0);

      const { instance: pv2 } = model.createInstance('property_value');
      setAttribute(pv2!, 'property_name', 'length');
      setAttribute(pv2!, 'unit', createRef(unit!.id, 'NAMED_UNIT'));
      setAttribute(pv2!, 'value', 20.0);

      const diags = validateUniqueRules(model);
      const pvViolations = diags.filter(
        (d) =>
          d.code === 'UNIQUE_VIOLATION' && d.entityName === 'PROPERTY_VALUE',
      );
      expect(pvViolations.length).toBeGreaterThanOrEqual(1);
    });

    it('should skip instances with undefined unique key attributes', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance: u1 } = model.createInstance('named_unit');
      setAttribute(u1!, 'name', 'meter');
      setAttribute(u1!, 'symbol', 'm');

      const { instance: u2 } = model.createInstance('named_unit');
      setAttribute(u2!, 'symbol', 'x');
      // name is not set — should be skipped

      const diags = validateUniqueRules(model);
      const violations = diags.filter((d) => d.code === 'UNIQUE_VIOLATION');
      expect(violations).toHaveLength(0);
    });
  });

  describe('Integration with validateModel', () => {
    it('should not emit the "not yet implemented" info diagnostic', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance } = model.createInstance('named_unit');
      setAttribute(instance!, 'name', 'meter');
      setAttribute(instance!, 'symbol', 'm');

      const diags = validateModel(model);
      const notImpl = diags.filter((d) =>
        d.message.includes('not yet implemented'),
      );
      expect(notImpl).toHaveLength(0);
    });

    it('should report UNIQUE_VIOLATION via validateModel', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance: u1 } = model.createInstance('named_unit');
      setAttribute(u1!, 'name', 'meter');
      setAttribute(u1!, 'symbol', 'm');

      const { instance: u2 } = model.createInstance('named_unit');
      setAttribute(u2!, 'name', 'meter');
      setAttribute(u2!, 'symbol', 'mt');

      const diags = validateModel(model);
      const violations = diags.filter((d) => d.code === 'UNIQUE_VIOLATION');
      expect(violations.length).toBeGreaterThanOrEqual(1);
    });
  });
});
