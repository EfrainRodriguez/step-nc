import type { SchemaDeclarationNode } from '@step-nc/express-parser';
import { parseExpress } from '@step-nc/express-parser';
import { describe, expect, it } from 'vitest';
import { getAllAttributes } from '../../src';
import { buildSchema } from '../../src/builder/build-schema';

function parseSchema(source: string): SchemaDeclarationNode {
  const result = parseExpress(source);
  if (result.ast.type !== 'SchemaDeclaration') {
    throw new Error(`Expected SchemaDeclaration, got ${result.ast.type}`);
  }
  return result.ast;
}

describe('Edge cases', () => {
  it('should handle empty schema (no declarations)', () => {
    const ast = parseSchema('SCHEMA empty; END_SCHEMA;');
    const { schema, diagnostics } = buildSchema(ast);

    expect(schema.name).toBe('empty');
    expect(schema.entities.size).toBe(0);
    expect(schema.types.size).toBe(0);
    expect(diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('should handle entity with no attributes', () => {
    const ast = parseSchema(`
      SCHEMA s;
        ENTITY empty_entity;
        END_ENTITY;
      END_SCHEMA;
    `);
    const { schema } = buildSchema(ast);

    const entity = schema.entities.get('EMPTY_ENTITY')!;
    expect(entity.explicitAttributes).toHaveLength(0);
    expect(entity.derivedAttributes).toHaveLength(0);
    expect(entity.inverseAttributes).toHaveLength(0);
  });

  it('should handle circular inheritance with diagnostics', () => {
    const ast = parseSchema(`
      SCHEMA s;
        ENTITY a SUBTYPE OF (b); END_ENTITY;
        ENTITY b SUBTYPE OF (a); END_ENTITY;
      END_SCHEMA;
    `);
    const { diagnostics } = buildSchema(ast);

    const circular = diagnostics.filter(
      (d) => d.code === 'CIRCULAR_INHERITANCE',
    );
    expect(circular.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle reference to nonexistent type', () => {
    const ast = parseSchema(`
      SCHEMA s;
        ENTITY e;
          x : nonexistent;
        END_ENTITY;
      END_SCHEMA;
    `);
    const { diagnostics } = buildSchema(ast);

    const unresolved = diagnostics.filter((d) => d.code === 'UNRESOLVED_TYPE');
    expect(unresolved.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle multi-name attributes (a, b, c : REAL)', () => {
    const ast = parseSchema(`
      SCHEMA s;
        ENTITY e;
          a, b, c : REAL;
        END_ENTITY;
      END_SCHEMA;
    `);
    const { schema } = buildSchema(ast);

    const entity = schema.entities.get('E')!;
    expect(entity.explicitAttributes).toHaveLength(3);
    expect(entity.explicitAttributes.map((a) => a.name)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('should handle enumeration type', () => {
    const ast = parseSchema(`
      SCHEMA s;
        TYPE color = ENUMERATION OF (red, green, blue);
        END_TYPE;
      END_SCHEMA;
    `);
    const { schema } = buildSchema(ast);

    const colorType = schema.types.get('COLOR')!;
    expect(colorType.underlyingType.kind).toBe('enumeration');
    if (colorType.underlyingType.kind === 'enumeration') {
      expect(colorType.underlyingType.values).toEqual(['red', 'green', 'blue']);
      expect(colorType.underlyingType.extensible).toBe(false);
    }
  });

  it('should handle extensible enumeration', () => {
    const ast = parseSchema(`
      SCHEMA s;
        TYPE ext_enum = EXTENSIBLE ENUMERATION OF (val1, val2);
        END_TYPE;
      END_SCHEMA;
    `);
    const { schema } = buildSchema(ast);

    const t = schema.types.get('EXT_ENUM')!;
    expect(t.underlyingType.kind).toBe('enumeration');
    if (t.underlyingType.kind === 'enumeration') {
      expect(t.underlyingType.extensible).toBe(true);
    }
  });

  it('should handle multiple supertypes (multiple inheritance)', () => {
    const ast = parseSchema(`
      SCHEMA s;
        ENTITY a; x : REAL; END_ENTITY;
        ENTITY b; y : REAL; END_ENTITY;
        ENTITY c SUBTYPE OF (a, b); z : REAL; END_ENTITY;
      END_SCHEMA;
    `);
    const { schema, diagnostics } = buildSchema(ast);

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    const c = schema.entities.get('C')!;
    expect(c.supertypes).toHaveLength(2);
    const allAttrs = getAllAttributes(c);
    expect(allAttrs.map((a) => a.name).sort()).toEqual(['x', 'y', 'z']);
  });

  it('should handle deep inheritance chain for attribute collection', () => {
    const ast = parseSchema(`
      SCHEMA s;
        ENTITY a; x : REAL; END_ENTITY;
        ENTITY b SUBTYPE OF (a); y : REAL; END_ENTITY;
        ENTITY c SUBTYPE OF (b); z : REAL; END_ENTITY;
        ENTITY d SUBTYPE OF (c); w : REAL; END_ENTITY;
      END_SCHEMA;
    `);
    const { schema } = buildSchema(ast);

    const d = schema.entities.get('D')!;
    const allAttrs = getAllAttributes(d);
    expect(allAttrs.map((a) => a.name)).toEqual(['x', 'y', 'z', 'w']);
  });

  it('should handle SELECT type', () => {
    const ast = parseSchema(`
      SCHEMA s;
        ENTITY e1; END_ENTITY;
        ENTITY e2; END_ENTITY;
        TYPE my_select = SELECT (e1, e2); END_TYPE;
      END_SCHEMA;
    `);
    const { schema, diagnostics } = buildSchema(ast);

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    const selectType = schema.types.get('MY_SELECT')!;
    expect(selectType.underlyingType.kind).toBe('select');
    if (selectType.underlyingType.kind === 'select') {
      expect(selectType.underlyingType.selections).toHaveLength(2);
    }
  });

  it('should handle duplicate declarations with diagnostics', () => {
    const ast = parseSchema(`
      SCHEMA s;
        ENTITY e; END_ENTITY;
        ENTITY e; END_ENTITY;
      END_SCHEMA;
    `);
    const { diagnostics } = buildSchema(ast);

    const dups = diagnostics.filter((d) => d.code === 'DUPLICATE_DECLARATION');
    expect(dups).toHaveLength(1);
  });
});
