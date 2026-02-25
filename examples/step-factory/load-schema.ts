import { buildSchema } from '@step-nc/express-dictionary';
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
