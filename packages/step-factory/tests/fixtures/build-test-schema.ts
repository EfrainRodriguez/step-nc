import { buildSchema, type ExpressSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_GEOMETRY_EXP = resolve(__dirname, './test-geometry.exp');

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
