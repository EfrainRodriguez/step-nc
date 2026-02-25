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

describe('Multi-schema USE/REFERENCE resolution', () => {
  it('should resolve USE FROM importing all declarations', () => {
    const registry = new SchemaRegistry();

    registry.buildAndRegister(
      parseSchema(`
        SCHEMA base_schema;
          ENTITY base_entity; x : REAL; END_ENTITY;
          TYPE base_type = INTEGER; END_TYPE;
        END_SCHEMA;
      `),
    );

    registry.buildAndRegister(
      parseSchema(`
        SCHEMA dependent_schema;
          USE FROM base_schema;
          ENTITY child_entity SUBTYPE OF (base_entity);
            y : base_type;
          END_ENTITY;
        END_SCHEMA;
      `),
    );

    const diags = registry.resolveInterfaces();
    const errors = diags.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    const dependent = registry.get('dependent_schema')!;
    expect(dependent.entities.has('BASE_ENTITY')).toBe(true);
    expect(dependent.types.has('BASE_TYPE')).toBe(true);
  });

  it('should resolve USE FROM with specific items', () => {
    const registry = new SchemaRegistry();

    registry.buildAndRegister(
      parseSchema(`
        SCHEMA provider;
          ENTITY e1; END_ENTITY;
          ENTITY e2; END_ENTITY;
          TYPE t1 = REAL; END_TYPE;
        END_SCHEMA;
      `),
    );

    registry.buildAndRegister(
      parseSchema(`
        SCHEMA consumer;
          USE FROM provider (e1, t1);
        END_SCHEMA;
      `),
    );

    const diags = registry.resolveInterfaces();
    const errors = diags.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    const consumer = registry.get('consumer')!;
    expect(consumer.entities.has('E1')).toBe(true);
    expect(consumer.types.has('T1')).toBe(true);
    expect(consumer.entities.has('E2')).toBe(false);
  });

  it('should emit UNRESOLVED_SCHEMA_REF for unknown schemas', () => {
    const registry = new SchemaRegistry();

    registry.buildAndRegister(
      parseSchema(`
        SCHEMA s;
          USE FROM nonexistent_schema;
        END_SCHEMA;
      `),
    );

    const diags = registry.resolveInterfaces();
    const unresolvedSchemas = diags.filter(
      (d) => d.code === 'UNRESOLVED_SCHEMA_REF',
    );
    expect(unresolvedSchemas).toHaveLength(1);
  });

  it('should emit UNRESOLVED_INTERFACE_ITEM for unknown items', () => {
    const registry = new SchemaRegistry();

    registry.buildAndRegister(
      parseSchema(`
        SCHEMA provider;
          ENTITY e1; END_ENTITY;
        END_SCHEMA;
      `),
    );

    registry.buildAndRegister(
      parseSchema(`
        SCHEMA consumer;
          USE FROM provider (nonexistent_item);
        END_SCHEMA;
      `),
    );

    const diags = registry.resolveInterfaces();
    const unresolvedItems = diags.filter(
      (d) => d.code === 'UNRESOLVED_INTERFACE_ITEM',
    );
    expect(unresolvedItems).toHaveLength(1);
  });

  it('should resolve REFERENCE FROM', () => {
    const registry = new SchemaRegistry();

    registry.buildAndRegister(
      parseSchema(`
        SCHEMA base;
          ENTITY shared_entity; val : REAL; END_ENTITY;
        END_SCHEMA;
      `),
    );

    registry.buildAndRegister(
      parseSchema(`
        SCHEMA consumer;
          REFERENCE FROM base (shared_entity);
          ENTITY local SUBTYPE OF (shared_entity); END_ENTITY;
        END_SCHEMA;
      `),
    );

    const diags = registry.resolveInterfaces();
    const errors = diags.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    const consumer = registry.get('consumer')!;
    expect(consumer.entities.has('SHARED_ENTITY')).toBe(true);
  });
});
