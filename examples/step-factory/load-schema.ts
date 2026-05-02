import type {
  EntityDefinition,
  ExpressSchema,
} from '@step-nc/express-dictionary';
import { buildSchema, SchemaRegistry } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface LoadSchemaResult {
  schema: ReturnType<typeof buildSchema>['schema'];
  diagnostics: ReturnType<typeof buildSchema>['diagnostics'];
  parseDiagnostics?: Array<{ severity: string; code: string; message: string }>;
}

/**
 * Load EXPRESS source from file, parse and build schema.
 * Default path is data/geometry.exp (resolved from current working directory).
 */
export function loadSchemaFromFile(filePath?: string): LoadSchemaResult {
  const path = resolve(filePath ?? 'data/geometry.exp');
  let source: string;
  try {
    source = readFileSync(path, 'utf-8');
  } catch {
    throw new Error(`Could not read file: ${path}`);
  }

  const parseResult = parseExpress(source);
  if (parseResult.ast.type !== 'SchemaDeclaration') {
    throw new Error('Expected a schema (SchemaDeclaration) from parser.');
  }

  const result = buildSchema(parseResult.ast);
  const parseDiagnostics =
    parseResult.diagnostics?.length &&
    parseResult.diagnostics.map((d) => ({
      severity: d.severity,
      code: d.code,
      message: d.message,
    }));
  return {
    schema: result.schema,
    diagnostics: result.diagnostics,
    ...(parseDiagnostics && { parseDiagnostics }),
  };
}

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

const defaultGeometryWithRulesPath = resolve(
  process.cwd(),
  'data/geometry-with-rules.exp',
);
const defaultMultiSchemaPath = resolve(process.cwd(), 'data/multi-schema.exp');

/** Load single schema from examples/data/geometry-with-rules.exp (or given path). */
export function loadGeometryWithRulesSchema(filePath?: string): ExpressSchema {
  const path = filePath ?? defaultGeometryWithRulesPath;
  const { schema, diagnostics } = loadSchemaFromFile(path);
  const errors = diagnostics.filter((d) => d.severity === 'error');
  if (errors.length > 0) {
    throw new Error(
      `Schema errors: ${errors.map((e) => e.message).join(', ')}`,
    );
  }
  return schema;
}

export interface MultiSchemaFixture {
  registry: SchemaRegistry;
  baseSchema: ExpressSchema;
  extendedSchema: ExpressSchema;
}

/** Load multi-schema from examples/data/multi-schema.exp (or given path). */
export function loadMultiSchemaFromFile(filePath?: string): MultiSchemaFixture {
  const path = filePath ?? defaultMultiSchemaPath;
  const source = readFileSync(path, 'utf-8');
  const registry = new SchemaRegistry();

  const schemasText = source.split(/(?=SCHEMA\s)/i);
  for (const schemaText of schemasText) {
    const trimmed = schemaText.trim();
    if (!trimmed) continue;
    const { ast, diagnostics: parseDiags } = parseExpress(trimmed);
    const parseErrors = parseDiags.filter((d) => d.code !== 'INFO');
    if (parseErrors.length > 0) {
      throw new Error(
        `Parse errors: ${parseErrors.map((e) => e.message).join(', ')}`,
      );
    }
    if (ast.type !== 'SchemaDeclaration') {
      throw new Error('Expected SchemaDeclaration');
    }
    registry.buildAndRegister(ast);
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

  return { registry, baseSchema, extendedSchema };
}
