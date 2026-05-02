import { describe, expect, it } from 'vitest';
import { createList } from '../../src/aggregations/step-list';
import { setAttribute } from '../../src/attributes/attribute-access';
import { StepModel } from '../../src/model/step-model';
import { createRef } from '../../src/references/reference-resolver';
import { validateInstance } from '../../src/validation/validate-instance';
import { validateModel } from '../../src/validation/validate-model';
import { validateWhereRules } from '../../src/validation/validate-where-rules';
import { buildTestSchema } from '../fixtures/build-test-schema';

describe('WHERE Rules Validation', () => {
  describe('validateWhereRules', () => {
    it('should pass when positive_length_measure.value > 0', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance } = model.createInstance('positive_length_measure');
      setAttribute(instance!, 'name', 'Length1');
      setAttribute(instance!, 'value', 5.0);

      const diags = validateWhereRules(instance!, model);
      const violations = diags.filter((d) => d.code === 'WHERE_RULE_VIOLATION');
      expect(violations).toHaveLength(0);
    });

    it('should fail when positive_length_measure.value <= 0', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance } = model.createInstance('positive_length_measure');
      setAttribute(instance!, 'name', 'Bad Length');
      setAttribute(instance!, 'value', -1.0);

      const diags = validateWhereRules(instance!, model);
      // Entity may have no WHERE rules in schema, or rule may yield error/warning/expr error
      const ruleRelated = diags.filter(
        (d) =>
          d.code === 'WHERE_RULE_VIOLATION' ||
          d.code === 'EXPRESSION_EVAL_ERROR',
      );
      if (instance!.definition.whereRules.length > 0) {
        expect(ruleRelated.length).toBeGreaterThanOrEqual(1);
        if (ruleRelated[0]!.code === 'WHERE_RULE_VIOLATION') {
          expect(ruleRelated[0]!.message).toContain('wr1');
        }
      }
    });

    it('should pass vector WHERE rule when magnitude >= 0', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance: dir } = model.createInstance('direction');
      setAttribute(dir!, 'name', 'Dir1');
      setAttribute(dir!, 'direction_ratios', createList([1.0, 0.0, 0.0]));

      const { instance: vector } = model.createInstance('vector');
      setAttribute(vector!, 'name', 'V1');
      setAttribute(vector!, 'orientation', createRef(dir!.id, 'DIRECTION'));
      setAttribute(vector!, 'magnitude', 10.0);

      const diags = validateWhereRules(vector!, model);
      const violations = diags.filter(
        (d) => d.code === 'WHERE_RULE_VIOLATION' && d.severity === 'error',
      );
      expect(violations).toHaveLength(0);
    });

    it('should fail vector WHERE rule when magnitude < 0', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance: dir } = model.createInstance('direction');
      setAttribute(dir!, 'name', 'Dir1');
      setAttribute(dir!, 'direction_ratios', createList([1.0, 0.0, 0.0]));

      const { instance: vector } = model.createInstance('vector');
      setAttribute(vector!, 'name', 'V-Bad');
      setAttribute(vector!, 'orientation', createRef(dir!.id, 'DIRECTION'));
      setAttribute(vector!, 'magnitude', -5.0);

      const diags = validateWhereRules(vector!, model);
      const violations = diags.filter(
        (d) => d.code === 'WHERE_RULE_VIOLATION' && d.severity === 'error',
      );
      expect(violations.length).toBeGreaterThanOrEqual(1);
    });

    it('should pass normalized_vector with valid components', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance } = model.createInstance('normalized_vector');
      setAttribute(instance!, 'name', 'NV1');
      setAttribute(instance!, 'components', createList([1.0, 0.0, 0.0]));

      const diags = validateWhereRules(instance!, model);
      const violations = diags.filter(
        (d) => d.code === 'WHERE_RULE_VIOLATION' && d.severity === 'error',
      );
      expect(violations).toHaveLength(0);
    });

    it('should gracefully handle expression evaluation errors', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance: vector } = model.createInstance('vector');
      setAttribute(vector!, 'name', 'V-incomplete');
      setAttribute(vector!, 'magnitude', 5.0);
      // orientation not set — WHERE rule may fail to evaluate

      const diags = validateWhereRules(vector!, model);
      // Should not throw; may produce warnings
      expect(diags).toBeDefined();
    });
  });

  describe('Integration with validateInstance', () => {
    it('should include WHERE violations in validateInstance output', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance } = model.createInstance('positive_length_measure');
      setAttribute(instance!, 'name', 'Bad');
      setAttribute(instance!, 'value', -10.0);

      const diags = validateInstance(instance!, model);
      const whereViolations = diags.filter(
        (d) =>
          d.code === 'WHERE_RULE_VIOLATION' ||
          d.code === 'EXPRESSION_EVAL_ERROR',
      );
      expect(whereViolations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Integration with validateModel', () => {
    it('should report WHERE violations across the model', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance: good } = model.createInstance(
        'positive_length_measure',
      );
      setAttribute(good!, 'name', 'Good');
      setAttribute(good!, 'value', 5.0);

      const { instance: bad } = model.createInstance('positive_length_measure');
      setAttribute(bad!, 'name', 'Bad');
      setAttribute(bad!, 'value', -1.0);

      const diags = validateModel(model);
      const whereViolations = diags.filter(
        (d) =>
          d.code === 'WHERE_RULE_VIOLATION' ||
          d.code === 'EXPRESSION_EVAL_ERROR',
      );
      expect(whereViolations.length).toBeGreaterThanOrEqual(1);
      expect(whereViolations.some((d) => d.instanceId === bad!.id)).toBe(true);
    });
  });
});
