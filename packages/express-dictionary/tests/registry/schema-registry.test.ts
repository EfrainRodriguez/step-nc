import type { SchemaDeclarationNode } from '@step-nc/express-parser';
import { parseExpress } from '@step-nc/express-parser';
import { describe, expect, it } from 'vitest';
import { SchemaRegistry } from '../../src/registry/schema-registry';

function parseSchema(source: string): SchemaDeclarationNode {
  const result = parseExpress(source);
  if (result.ast.type !== 'SchemaDeclaration') {
    throw new Error(`Expected SchemaDeclaration, got ${result.ast.type}`);
  }
  return result.ast;
}

describe('SchemaRegistry', () => {
  it('should build and register a schema', () => {
    const registry = new SchemaRegistry();
    const ast = parseSchema(`
      SCHEMA test_schema;
        ENTITY point; x : REAL; END_ENTITY;
      END_SCHEMA;
    `);

    const { schema } = registry.buildAndRegister(ast);

    expect(schema.name).toBe('test_schema');
    expect(registry.size).toBe(1);
    expect(registry.get('test_schema')).toBe(schema);
    expect(registry.get('TEST_SCHEMA')).toBe(schema);
  });

  it('should list all registered schemas', () => {
    const registry = new SchemaRegistry();

    registry.buildAndRegister(parseSchema('SCHEMA s1; END_SCHEMA;'));
    registry.buildAndRegister(parseSchema('SCHEMA s2; END_SCHEMA;'));

    expect(registry.list()).toHaveLength(2);
  });

  it('should return undefined for unregistered schema', () => {
    const registry = new SchemaRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
  });
});
