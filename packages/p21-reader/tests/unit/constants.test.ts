import type { ExpressSchema } from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { describe, expect, it } from 'vitest';
import { findConstant } from '../../src/constants';

function buildSchemaFromSource(source: string): ExpressSchema {
  const { ast } = parseExpress(source);
  if (ast.type !== 'SchemaDeclaration') {
    throw new Error('Expected SchemaDeclaration');
  }
  const { schema, diagnostics } = buildSchema(ast);
  const errors = diagnostics.filter((d) => d.severity === 'error');
  if (errors.length > 0) {
    throw new Error(
      `Schema errors: ${errors.map((e) => e.message).join(', ')}`,
    );
  }
  return schema;
}

describe('constants', () => {
  it('should find a constant defined in the schema', () => {
    const schema = buildSchemaFromSource(`
      SCHEMA CONST_TEST;
        CONSTANT
          PI : REAL := 3.14159;
        END_CONSTANT;
        ENTITY dummy;
        END_ENTITY;
      END_SCHEMA;
    `);

    const result = findConstant('PI', schema);
    expect(result).toBeDefined();
    expect(result!.name).toBe('PI');
  });

  it('should return undefined for unknown constant', () => {
    const schema = buildSchemaFromSource(`
      SCHEMA CONST_TEST2;
        ENTITY dummy;
        END_ENTITY;
      END_SCHEMA;
    `);

    const result = findConstant('NONEXISTENT', schema);
    expect(result).toBeUndefined();
  });

  it('should be case-insensitive', () => {
    const schema = buildSchemaFromSource(`
      SCHEMA CONST_TEST3;
        CONSTANT
          MY_VALUE : INTEGER := 42;
        END_CONSTANT;
        ENTITY dummy;
        END_ENTITY;
      END_SCHEMA;
    `);

    expect(findConstant('my_value', schema)).toBeDefined();
    expect(findConstant('MY_VALUE', schema)).toBeDefined();
  });
});
