import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  getAllAttributes,
  getAllEntities,
  getAllSubtypes,
  getAllTypes,
  getEntity,
  getInheritedAttributes,
  getInstantiableEntities,
  getOwnAttributes,
  getSupertypeChain,
  getType,
  isInstantiable,
  isSubtypeOf,
  resolveToBaseType,
} from '../../src';
import { buildSchema } from '../../src/builder/build-schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GEOMETRY_EXP = resolve(
  __dirname,
  '../../../../examples/data/geometry.exp',
);

function build(filePath: string) {
  const source = readFileSync(filePath, 'utf-8');
  const result = parseExpress(source);
  if (result.ast.type !== 'SchemaDeclaration') {
    throw new Error(`Expected SchemaDeclaration`);
  }
  return buildSchema(result.ast);
}

describe('Integration: geometry.exp', () => {
  it('should build without errors', () => {
    const { schema, diagnostics } = build(GEOMETRY_EXP);
    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);
    expect(schema.name).toBe('geometry');
  });

  it('should collect 4 entities, 2 types, 1 function', () => {
    const { schema } = build(GEOMETRY_EXP);
    expect(getAllEntities(schema)).toHaveLength(4);
    expect(getAllTypes(schema)).toHaveLength(2);
    expect(schema.functions.size).toBe(1);
  });

  it('should resolve inheritance: cartesian_point → point', () => {
    const { schema } = build(GEOMETRY_EXP);
    const cp = getEntity(schema, 'cartesian_point')!;
    const point = getEntity(schema, 'point')!;

    expect(cp.supertypes).toHaveLength(1);
    expect(cp.supertypes[0]).toBe(point);
    expect(point.subtypes).toContain(cp);
  });

  it('should compute inherited attributes of cartesian_point', () => {
    const { schema } = build(GEOMETRY_EXP);
    const cp = getEntity(schema, 'cartesian_point')!;

    const allAttrs = getAllAttributes(cp);
    expect(allAttrs.map((a) => a.name)).toContain('coordinates');

    const ownAttrs = getOwnAttributes(cp);
    expect(ownAttrs).toHaveLength(0);

    const inherited = getInheritedAttributes(cp);
    expect(inherited).toHaveLength(1);
    expect(inherited[0]!.name).toBe('coordinates');
  });

  it('should resolve vector.orientation → entity direction', () => {
    const { schema } = build(GEOMETRY_EXP);
    const vector = getEntity(schema, 'vector')!;
    const orientation = vector.explicitAttributes.find(
      (a) => a.name === 'orientation',
    )!;

    expect(orientation.type.kind).toBe('entity');
    if (orientation.type.kind === 'entity') {
      expect(orientation.type.entity.name).toBe('direction');
    }
  });

  it('should resolve point.coordinates → LIST OF length_measure', () => {
    const { schema } = build(GEOMETRY_EXP);
    const point = getEntity(schema, 'point')!;
    const coords = point.explicitAttributes.find(
      (a) => a.name === 'coordinates',
    )!;

    expect(coords.type.kind).toBe('aggregation');
    if (coords.type.kind === 'aggregation') {
      expect(coords.type.aggregationKind).toBe('LIST');
      expect(coords.type.elementType.kind).toBe('defined');
      if (coords.type.elementType.kind === 'defined') {
        expect(coords.type.elementType.definition.name).toBe('length_measure');
      }
    }
  });

  it('should resolve length_measure → REAL', () => {
    const { schema } = build(GEOMETRY_EXP);
    const lm = getType(schema, 'length_measure')!;
    const base = resolveToBaseType(lm.underlyingType);
    expect(base.kind).toBe('simple');
    if (base.kind === 'simple') {
      expect(base.simpleType).toBe('REAL');
    }
  });

  it('should preserve where rule of vector', () => {
    const { schema } = build(GEOMETRY_EXP);
    const vector = getEntity(schema, 'vector')!;
    expect(vector.whereRules).toHaveLength(1);
    expect(vector.whereRules[0]!.label).toBe('WR1');
  });

  it('should collect dot_product as FunctionDefinition', () => {
    const { schema } = build(GEOMETRY_EXP);
    const fn = schema.functions.get('DOT_PRODUCT')!;

    expect(fn.name).toBe('dot_product');
    expect(fn.parameters).toHaveLength(2);
    expect(fn.returnType.kind).toBe('simple');
    if (fn.returnType.kind === 'simple') {
      expect(fn.returnType.simpleType).toBe('REAL');
    }
  });

  it('should compute instantiable entities', () => {
    const { schema } = build(GEOMETRY_EXP);
    const instantiable = getInstantiableEntities(schema);
    const names = new Set(instantiable.map((e) => e.name));

    expect(names.has('cartesian_point')).toBe(true);
    expect(names.has('vector')).toBe(true);
    expect(names.has('direction')).toBe(true);
    expect(names.has('point')).toBe(false);
  });

  it('should compute supertype chain and subtype checks', () => {
    const { schema } = build(GEOMETRY_EXP);
    const cp = getEntity(schema, 'cartesian_point')!;
    const point = getEntity(schema, 'point')!;

    expect(getSupertypeChain(cp).map((e) => e.name)).toEqual(['point']);
    expect(getAllSubtypes(point).map((e) => e.name)).toEqual([
      'cartesian_point',
    ]);
    expect(isSubtypeOf(cp, point)).toBe(true);
    expect(isInstantiable(point)).toBe(false);
    expect(isInstantiable(cp)).toBe(true);
  });
});
