import {
  buildSchema,
  getEntity,
  type ExpressSchema,
} from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  StepModel,
  cloneInstance,
  createRef,
  instanceToRecord,
  resolveRef,
  setAttribute,
  validateModel,
} from '../../src';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SDAI_DICTIONARY_EXP = resolve(
  __dirname,
  '../../../../docs/express/sdai/SDAI-dictionary_schema.exp',
);

function buildSdaiSchema(): ExpressSchema {
  const source = readFileSync(SDAI_DICTIONARY_EXP, 'utf-8');
  const { ast } = parseExpress(source);
  if (ast.type !== 'SchemaDeclaration') {
    throw new Error('Expected SchemaDeclaration');
  }
  const { schema, diagnostics } = buildSchema(ast);
  const errors = diagnostics.filter((d) => d.severity === 'error');
  if (errors.length > 0) {
    throw new Error(
      `SDAI schema has errors: ${errors.map((e) => e.message).join(', ')}`,
    );
  }
  return schema;
}

describe('Integration: SDAI dictionary_schema population', () => {
  let schema: ExpressSchema;

  beforeAll(() => {
    schema = buildSdaiSchema();
  });

  it('should create StepModel with SDAI dictionary_schema', () => {
    const model = new StepModel(schema);
    expect(model.schema.name).toBe('dictionary_schema');
    expect(model.size).toBe(0);
  });

  it('should create instantiable entities from SDAI schema', () => {
    const model = new StepModel(schema);

    const entityDef = getEntity(schema, 'entity_definition');
    expect(entityDef).toBeDefined();

    if (entityDef && entityDef.instantiable) {
      const { instance, diagnostics } =
        model.createInstance('entity_definition');
      expect(instance).toBeDefined();
      const errors = diagnostics.filter((d) => d.severity === 'error');
      expect(errors).toHaveLength(0);
    }
  });

  it('should resolve references between SDAI instances', () => {
    const model = new StepModel(schema);

    const schemaDef = getEntity(schema, 'schema_definition');
    if (!schemaDef || !schemaDef.instantiable) return;

    const { instance: schemaInst } = model.createInstance('schema_definition');
    if (!schemaInst) return;

    const entityDef = getEntity(schema, 'entity_definition');
    if (!entityDef || !entityDef.instantiable) return;

    const { instance: entityInst } = model.createInstance('entity_definition');
    if (!entityInst) return;

    const ref = createRef(entityInst.id, 'ENTITY_DEFINITION');
    const resolved = resolveRef(model, ref);
    expect(resolved).toBe(entityInst);
  });

  it('should clone an instance and produce different id', () => {
    const model = new StepModel(schema);

    const entityDef = getEntity(schema, 'entity_definition');
    if (!entityDef || !entityDef.instantiable) return;

    const { instance: original } = model.createInstance('entity_definition');
    if (!original) return;

    setAttribute(original, 'name', 'test_entity');

    const { instance: cloned, diagnostics } = cloneInstance(model, original.id);

    expect(cloned).toBeDefined();
    expect(diagnostics).toHaveLength(0);
    expect(cloned!.id).not.toBe(original.id);
    expect(cloned!.typeName).toBe(original.typeName);
  });

  it('should produce instanceToRecord for SDAI entities', () => {
    const model = new StepModel(schema);

    const entityDef = getEntity(schema, 'entity_definition');
    if (!entityDef || !entityDef.instantiable) return;

    const { instance } = model.createInstance('entity_definition');
    if (!instance) return;

    const record = instanceToRecord(instance);
    expect(record.id).toBe(instance.id);
    expect(record.typeName).toBe(instance.typeName);
    expect(typeof record.attributes).toBe('object');
  });

  it('should run validateModel on populated SDAI model', () => {
    const model = new StepModel(schema);

    const entityDef = getEntity(schema, 'entity_definition');
    if (!entityDef || !entityDef.instantiable) return;

    model.createInstance('entity_definition');

    const diags = validateModel(model);
    expect(Array.isArray(diags)).toBe(true);
  });
});
