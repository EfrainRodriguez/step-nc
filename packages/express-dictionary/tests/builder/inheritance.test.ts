import type { SchemaDeclarationNode } from '@step-nc/express-parser';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildInheritance } from '../../src/builder/build-inheritance';
import { collectDeclarations } from '../../src/builder/collect-declarations';
import { resolveTypes } from '../../src/builder/resolve-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GEOMETRY_EXP = resolve(
  __dirname,
  '../../../../examples/data/geometry.exp',
);

function parseSchema(source: string): SchemaDeclarationNode {
  const result = parseExpress(source);
  if (result.ast.type !== 'SchemaDeclaration') {
    throw new Error(`Expected SchemaDeclaration, got ${result.ast.type}`);
  }
  return result.ast;
}

function buildFull(source: string) {
  const ast = parseSchema(source);
  const { schema, diagnostics: collectDiags } = collectDeclarations(ast);
  const resolveDiags = resolveTypes(schema);
  const inheritDiags = buildInheritance(schema);
  return {
    schema,
    diagnostics: [...collectDiags, ...resolveDiags, ...inheritDiags],
  };
}

describe('buildInheritance', () => {
  it('should resolve supertypes in geometry.exp', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const { schema, diagnostics } = buildFull(source);

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    const cartesianPoint = schema.entities.get('CARTESIAN_POINT')!;
    expect(cartesianPoint.supertypes).toHaveLength(1);
    expect(cartesianPoint.supertypes[0]!.name).toBe('point');
  });

  it('should compute subtypes (inverse)', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const { schema } = buildFull(source);

    const point = schema.entities.get('POINT')!;
    expect(point.subtypes).toHaveLength(1);
    expect(point.subtypes[0]!.name).toBe('cartesian_point');
  });

  it('should mark abstract entities as not instantiable', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const { schema } = buildFull(source);

    const point = schema.entities.get('POINT')!;
    expect(point.abstract).toBe(true);
    expect(point.instantiable).toBe(false);

    const cartesianPoint = schema.entities.get('CARTESIAN_POINT')!;
    expect(cartesianPoint.abstract).toBe(false);
    expect(cartesianPoint.instantiable).toBe(true);
  });

  it('should handle multi-level inheritance', () => {
    const { schema, diagnostics } = buildFull(`
      SCHEMA s;
        ENTITY a; x : REAL; END_ENTITY;
        ENTITY b SUBTYPE OF (a); y : REAL; END_ENTITY;
        ENTITY c SUBTYPE OF (b); z : REAL; END_ENTITY;
      END_SCHEMA;
    `);

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    const c = schema.entities.get('C')!;
    expect(c.supertypes).toHaveLength(1);
    expect(c.supertypes[0]!.name).toBe('b');

    const b = schema.entities.get('B')!;
    expect(b.supertypes).toHaveLength(1);
    expect(b.supertypes[0]!.name).toBe('a');

    const a = schema.entities.get('A')!;
    expect(a.subtypes).toHaveLength(1);
    expect(a.subtypes[0]!.name).toBe('b');
  });

  it('should handle multiple supertypes (multiple inheritance)', () => {
    const { schema, diagnostics } = buildFull(`
      SCHEMA s;
        ENTITY a; END_ENTITY;
        ENTITY b; END_ENTITY;
        ENTITY c SUBTYPE OF (a, b); END_ENTITY;
      END_SCHEMA;
    `);

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    const c = schema.entities.get('C')!;
    expect(c.supertypes).toHaveLength(2);
  });

  it('should detect circular inheritance', () => {
    const { diagnostics } = buildFull(`
      SCHEMA s;
        ENTITY a SUBTYPE OF (b); END_ENTITY;
        ENTITY b SUBTYPE OF (a); END_ENTITY;
      END_SCHEMA;
    `);

    const circular = diagnostics.filter(
      (d) => d.code === 'CIRCULAR_INHERITANCE',
    );
    expect(circular.length).toBeGreaterThanOrEqual(1);
  });

  it('should report unresolved supertype entity', () => {
    const { diagnostics } = buildFull(`
      SCHEMA s;
        ENTITY a SUBTYPE OF (nonexistent); END_ENTITY;
      END_SCHEMA;
    `);

    const unresolved = diagnostics.filter(
      (d) => d.code === 'UNRESOLVED_ENTITY_REF',
    );
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0]!.message).toContain('nonexistent');
  });
});
