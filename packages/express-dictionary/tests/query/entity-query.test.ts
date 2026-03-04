import type { SchemaDeclarationNode } from '@step-nc/express-parser';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildInheritance } from '../../src/builder/build-inheritance';
import { collectDeclarations } from '../../src/builder/collect-declarations';
import { resolveConstraints } from '../../src/builder/resolve-constraints';
import { resolveInverse } from '../../src/builder/resolve-inverse';
import { resolveTypes } from '../../src/builder/resolve-types';
import {
  getAllAttributes,
  getAllDerivedAttributes,
  getAllSubtypes,
  getDirectSubtypes,
  getInheritedAttributes,
  getOwnAttributes,
  getSupertypeChain,
  isInstantiable,
  isSubtypeOf,
} from '../../src/query/entity-query';
import { resolveToBaseType } from '../../src/query/type-query';

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
  const { schema } = collectDeclarations(ast);
  resolveTypes(schema);
  buildInheritance(schema);
  resolveInverse(schema);
  resolveConstraints(schema);
  return schema;
}

describe('Entity queries', () => {
  it('should get all attributes including inherited', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    const cartesianPoint = schema.entities.get('CARTESIAN_POINT')!;
    const allAttrs = getAllAttributes(cartesianPoint);

    // cartesian_point inherits 'coordinates' from point, and has no own attrs
    expect(allAttrs.map((a) => a.name)).toContain('coordinates');
  });

  it('should get own attributes only', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    const cartesianPoint = schema.entities.get('CARTESIAN_POINT')!;
    const ownAttrs = getOwnAttributes(cartesianPoint);
    expect(ownAttrs).toHaveLength(0);

    const point = schema.entities.get('POINT')!;
    const pointOwn = getOwnAttributes(point);
    expect(pointOwn).toHaveLength(1);
    expect(pointOwn[0]!.name).toBe('coordinates');
  });

  it('should get inherited attributes only', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    const cartesianPoint = schema.entities.get('CARTESIAN_POINT')!;
    const inherited = getInheritedAttributes(cartesianPoint);
    expect(inherited).toHaveLength(1);
    expect(inherited[0]!.name).toBe('coordinates');
  });

  it('should get supertype chain', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    const cartesianPoint = schema.entities.get('CARTESIAN_POINT')!;
    const chain = getSupertypeChain(cartesianPoint);
    expect(chain).toHaveLength(1);
    expect(chain[0]!.name).toBe('point');
  });

  it('should get all subtypes recursively', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    const point = schema.entities.get('POINT')!;
    const subtypes = getAllSubtypes(point);
    expect(subtypes).toHaveLength(1);
    expect(subtypes[0]!.name).toBe('cartesian_point');
  });

  it('should get direct subtypes', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    const point = schema.entities.get('POINT')!;
    const directSubs = getDirectSubtypes(point);
    expect(directSubs).toHaveLength(1);
  });

  it('should check isSubtypeOf', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    const cartesianPoint = schema.entities.get('CARTESIAN_POINT')!;
    const point = schema.entities.get('POINT')!;
    const vector = schema.entities.get('VECTOR')!;

    expect(isSubtypeOf(cartesianPoint, point)).toBe(true);
    expect(isSubtypeOf(point, cartesianPoint)).toBe(false);
    expect(isSubtypeOf(vector, point)).toBe(false);
  });

  it('should check isInstantiable', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    const point = schema.entities.get('POINT')!;
    const cartesianPoint = schema.entities.get('CARTESIAN_POINT')!;

    expect(isInstantiable(point)).toBe(false);
    expect(isInstantiable(cartesianPoint)).toBe(true);
  });

  it('should handle multi-level inheritance in queries', () => {
    const schema = buildFull(`
      SCHEMA s;
        ENTITY a; x : REAL; END_ENTITY;
        ENTITY b SUBTYPE OF (a); y : REAL; END_ENTITY;
        ENTITY c SUBTYPE OF (b); z : REAL; END_ENTITY;
      END_SCHEMA;
    `);

    const c = schema.entities.get('C')!;
    const allAttrs = getAllAttributes(c);
    expect(allAttrs.map((a) => a.name)).toEqual(['x', 'y', 'z']);

    const inherited = getInheritedAttributes(c);
    expect(inherited.map((a) => a.name)).toEqual(['x', 'y']);

    const chain = getSupertypeChain(c);
    expect(chain.map((e) => e.name)).toEqual(['b', 'a']);

    const a = schema.entities.get('A')!;
    expect(isSubtypeOf(c, a)).toBe(true);
    const allSubs = getAllSubtypes(a);
    expect(allSubs.map((e) => e.name).sort()).toEqual(['b', 'c']);
  });

  it('should resolve type chain with resolveToBaseType', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    const lengthMeasure = schema.types.get('LENGTH_MEASURE')!;
    const base = resolveToBaseType(lengthMeasure.underlyingType);
    expect(base.kind).toBe('simple');
    if (base.kind === 'simple') {
      expect(base.simpleType).toBe('REAL');
    }
  });

  it('getAllAttributes should exclude explicit attributes redeclared as derived', () => {
    const schema = buildFull(`
      SCHEMA s;
        ENTITY edge;
          edge_start : INTEGER;
          edge_end : INTEGER;
        END_ENTITY;
        ENTITY oriented_edge SUBTYPE OF (edge);
          orientation : BOOLEAN;
        DERIVE
          SELF\\edge.edge_start : INTEGER := 42;
        END_ENTITY;
      END_SCHEMA;
    `);

    const oriented = schema.entities.get('ORIENTED_EDGE')!;
    const allAttrs = getAllAttributes(oriented);
    const names = allAttrs.map((a) => a.name.toUpperCase());

    expect(names).not.toContain('EDGE_START');
    expect(names).toContain('EDGE_END');
    expect(names).toContain('ORIENTATION');
  });

  it('getAllDerivedAttributes should include redeclared derived from supertypes', () => {
    const schema = buildFull(`
      SCHEMA s;
        ENTITY edge;
          edge_start : INTEGER;
        END_ENTITY;
        ENTITY oriented_edge SUBTYPE OF (edge);
        DERIVE
          SELF\\edge.edge_start : INTEGER := 42;
        END_ENTITY;
      END_SCHEMA;
    `);

    const oriented = schema.entities.get('ORIENTED_EDGE')!;
    const allDerived = getAllDerivedAttributes(oriented);
    const names = allDerived.map((a) => a.name.toUpperCase());

    expect(names).toContain('EDGE_START');
  });

  it('getAllAttributes should exclude redeclared attrs for grandchild entities', () => {
    const schema = buildFull(`
      SCHEMA s;
        ENTITY a;
          x : INTEGER;
          y : INTEGER;
        END_ENTITY;
        ENTITY b SUBTYPE OF (a);
        DERIVE
          SELF\\a.x : INTEGER := 10;
        END_ENTITY;
        ENTITY c SUBTYPE OF (b);
          z : INTEGER;
        END_ENTITY;
      END_SCHEMA;
    `);

    const c = schema.entities.get('C')!;
    const allAttrs = getAllAttributes(c);
    const names = allAttrs.map((a) => a.name.toUpperCase());

    expect(names).not.toContain('X');
    expect(names).toContain('Y');
    expect(names).toContain('Z');
  });
});
