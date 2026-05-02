import {
  buildSchema,
  SchemaRegistry,
  type ExpressSchema,
} from '@step-nc/express-dictionary';
import type { EntityDefinition } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Re-link supertypes after resolveInterfaces has imported entities into the schema. */
function relinkInheritance(schema: ExpressSchema): void {
  for (const entity of schema.entities.values()) {
    if (entity.supertypes.length > 0) continue;
    for (const supertypeName of entity.supertypeNames) {
      const key = supertypeName.toUpperCase();
      const superEntity = schema.entities.get(key);
      if (superEntity) {
        (entity.supertypes as EntityDefinition[]).push(superEntity);
        if (!superEntity.subtypes.includes(entity)) {
          (superEntity.subtypes as EntityDefinition[]).push(entity);
        }
      }
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_GEOMETRY_EXP = resolve(__dirname, './test-geometry.exp');
const TEST_MULTI_SCHEMA_EXP = resolve(__dirname, './test-multi-schema.exp');

let cachedSchema: ExpressSchema | undefined;

export function buildTestSchema(): ExpressSchema {
  if (cachedSchema) return cachedSchema;

  const source = readFileSync(TEST_GEOMETRY_EXP, 'utf-8');
  const { ast } = parseExpress(source);
  if (ast.type !== 'SchemaDeclaration') {
    throw new Error('Expected SchemaDeclaration');
  }
  const { schema, diagnostics } = buildSchema(ast);
  const errors = diagnostics.filter((d) => d.severity === 'error');
  if (errors.length > 0) {
    throw new Error(
      `Test schema has errors: ${errors.map((e) => e.message).join(', ')}`,
    );
  }
  cachedSchema = schema;
  return schema;
}

export interface MultiSchemaFixture {
  registry: SchemaRegistry;
  baseSchema: ExpressSchema;
  extendedSchema: ExpressSchema;
}

let cachedMultiSchema: MultiSchemaFixture | undefined;

export function buildMultiSchemaFixture(): MultiSchemaFixture {
  if (cachedMultiSchema) return cachedMultiSchema;

  const source = readFileSync(TEST_MULTI_SCHEMA_EXP, 'utf-8');
  const registry = new SchemaRegistry();

  const schemasText = source.split(/(?=SCHEMA\s)/i);
  for (const schemaText of schemasText) {
    const trimmed = schemaText.trim();
    if (!trimmed) continue;
    const { ast, diagnostics: parseDiags } = parseExpress(trimmed);
    const parseErrors = parseDiags.filter((d) => d.code !== 'INFO');
    if (parseErrors.length > 0) {
      throw new Error(
        `Parse errors in multi-schema fixture: ${parseErrors.map((e) => e.message).join(', ')}`,
      );
    }
    if (ast.type !== 'SchemaDeclaration') {
      throw new Error('Expected SchemaDeclaration');
    }
    registry.buildAndRegister(ast);
    // Do not throw on build errors: the dependent schema will have unresolved
    // refs until resolveInterfaces runs and imports from the base schema.
  }

  const interfaceDiags = registry.resolveInterfaces();
  const ifaceErrors = interfaceDiags.filter((d) => d.severity === 'error');
  if (ifaceErrors.length > 0) {
    throw new Error(
      `Interface resolution errors: ${ifaceErrors.map((e) => e.message).join(', ')}`,
    );
  }

  const baseSchema = registry.get('GEOMETRY_BASE');
  const extendedSchema = registry.get('GEOMETRY_EXTENDED');

  if (!baseSchema || !extendedSchema) {
    throw new Error('Failed to resolve multi-schema fixture schemas');
  }

  relinkInheritance(extendedSchema);

  cachedMultiSchema = { registry, baseSchema, extendedSchema };
  return cachedMultiSchema;
}
