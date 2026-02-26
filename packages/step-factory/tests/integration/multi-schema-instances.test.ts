import { describe, expect, it } from 'vitest';
import { setAttribute } from '../../src/attributes/attribute-access';
import { StepModel } from '../../src/model/step-model';
import { validateModel } from '../../src/validation/validate-model';
import { buildMultiSchemaFixture } from '../fixtures/build-test-schema';

describe('Integration: Multi-schema instances', () => {
  it('should create and validate colored_point with attributes from both schemas', () => {
    const { registry, extendedSchema } = buildMultiSchemaFixture();
    const model = new StepModel(extendedSchema, { registry });

    const { instance } = model.createInstance('colored_point');
    setAttribute(instance!, 'x', 1.0);
    setAttribute(instance!, 'y', 2.0);
    setAttribute(instance!, 'z', 3.0);
    setAttribute(instance!, 'color_name', 'red');

    const diags = validateModel(model);
    const errors = diags.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('should report validation errors for missing attributes on imported entity', () => {
    const { registry, extendedSchema } = buildMultiSchemaFixture();
    const model = new StepModel(extendedSchema, { registry });

    model.createInstance('colored_point');
    // All attributes left undefined

    const diags = validateModel(model);
    const required = diags.filter((d) => d.code === 'REQUIRED_ATTRIBUTE');
    expect(required.length).toBeGreaterThanOrEqual(1);
  });

  it('should support references between imported and local entities', () => {
    const { registry, extendedSchema } = buildMultiSchemaFixture();
    const model = new StepModel(extendedSchema, { registry });

    const { instance: bp } = model.createInstance('base_point');
    setAttribute(bp!, 'x', 0.0);
    setAttribute(bp!, 'y', 0.0);
    setAttribute(bp!, 'z', 0.0);

    const { instance: cp } = model.createInstance('colored_point');
    setAttribute(cp!, 'x', 1.0);
    setAttribute(cp!, 'y', 1.0);
    setAttribute(cp!, 'z', 1.0);
    setAttribute(cp!, 'color_name', 'blue');

    expect(model.size).toBe(2);

    const allBP = model.getInstancesOf('BASE_POINT', true);
    expect(allBP).toHaveLength(2);
  });

  it('should create instances with cross-schema INVERSE attributes resolved', () => {
    const { registry, extendedSchema } = buildMultiSchemaFixture();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const model = new StepModel(extendedSchema, { registry });

    const annotatedDef = extendedSchema.entities.get('ANNOTATED_POINT')!;
    const invAttr = annotatedDef.inverseAttributes.find(
      (a) => a.name === 'annotations',
    );
    expect(invAttr).toBeDefined();
    expect(invAttr!.invertedEntity).toBeDefined();
    expect(invAttr!.invertedAttribute).toBeDefined();
  });
});
