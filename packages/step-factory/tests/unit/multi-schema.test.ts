import { describe, expect, it } from 'vitest';
import { StepModel } from '../../src/model/step-model';
import { buildMultiSchemaFixture } from '../fixtures/build-test-schema';

describe('Multi-Schema Support', () => {
  it('should resolve both schemas in registry', () => {
    const { registry, baseSchema, extendedSchema } = buildMultiSchemaFixture();

    expect(registry.size).toBe(2);
    expect(baseSchema.name.toUpperCase()).toBe('GEOMETRY_BASE');
    expect(extendedSchema.name.toUpperCase()).toBe('GEOMETRY_EXTENDED');
  });

  it('should have base_point entity in extended schema after resolving interfaces', () => {
    const { extendedSchema } = buildMultiSchemaFixture();

    expect(extendedSchema.entities.has('BASE_POINT')).toBe(true);
    expect(extendedSchema.entities.has('COLORED_POINT')).toBe(true);
  });

  it('should have label type in extended schema after USE FROM', () => {
    const { extendedSchema } = buildMultiSchemaFixture();

    expect(extendedSchema.types.has('LABEL')).toBe(true);
  });

  it('should create StepModel with extended schema and registry', () => {
    const { registry, extendedSchema } = buildMultiSchemaFixture();

    const model = new StepModel(extendedSchema, { registry });
    expect(model.schema).toBe(extendedSchema);
    expect(model.registry).toBe(registry);
  });

  it('should instantiate imported base_point in extended schema model', () => {
    const { registry, extendedSchema } = buildMultiSchemaFixture();
    const model = new StepModel(extendedSchema, { registry });

    const { instance, diagnostics } = model.createInstance('base_point');
    expect(diagnostics).toHaveLength(0);
    expect(instance).toBeDefined();
    expect(instance!.typeName).toBe('BASE_POINT');
  });

  it('should instantiate colored_point (subtype of imported base_point)', () => {
    const { registry, extendedSchema } = buildMultiSchemaFixture();
    const model = new StepModel(extendedSchema, { registry });

    const { instance, diagnostics } = model.createInstance('colored_point');
    expect(diagnostics).toHaveLength(0);
    expect(instance).toBeDefined();
    expect(instance!.typeName).toBe('COLORED_POINT');

    expect(instance!.attributes.has('X')).toBe(true);
    expect(instance!.attributes.has('Y')).toBe(true);
    expect(instance!.attributes.has('Z')).toBe(true);
    expect(instance!.attributes.has('COLOR_NAME')).toBe(true);
  });

  it('should return correct entity origin schema', () => {
    const { registry, extendedSchema } = buildMultiSchemaFixture();
    const model = new StepModel(extendedSchema, { registry });

    const { instance: base } = model.createInstance('base_point');
    const { instance: colored } = model.createInstance('colored_point');

    const baseOrigin = model.getEntityOriginSchema(base!);
    const coloredOrigin = model.getEntityOriginSchema(colored!);

    expect(baseOrigin.toUpperCase()).toBe('GEOMETRY_BASE');
    expect(coloredOrigin.toUpperCase()).toBe('GEOMETRY_EXTENDED');
  });

  it('should support polymorphic queries across imported entities', () => {
    const { registry, extendedSchema } = buildMultiSchemaFixture();
    const model = new StepModel(extendedSchema, { registry });

    model.createInstance('base_point');
    model.createInstance('colored_point');

    const allBasePoints = model.getInstancesOf('BASE_POINT', true);
    expect(allBasePoints).toHaveLength(2);
  });
});
