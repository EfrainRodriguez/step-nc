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
  getAllEntities,
  getAllTypes,
  getEntity,
  getInstantiableEntities,
  getNamedType,
  getType,
} from '../../src/query/schema-query';

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

describe('Schema queries', () => {
  it('should get entity by name (case-insensitive)', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    expect(getEntity(schema, 'point')).toBeDefined();
    expect(getEntity(schema, 'POINT')).toBeDefined();
    expect(getEntity(schema, 'Point')).toBeDefined();
    expect(getEntity(schema, 'nonexistent')).toBeUndefined();
  });

  it('should get type by name', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    expect(getType(schema, 'length_measure')).toBeDefined();
    expect(getType(schema, 'LENGTH_MEASURE')).toBeDefined();
  });

  it('should get named type (entity or type)', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    expect(getNamedType(schema, 'point')).toBeDefined();
    expect(getNamedType(schema, 'length_measure')).toBeDefined();
  });

  it('should get all entities', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    const entities = getAllEntities(schema);
    expect(entities).toHaveLength(4);
  });

  it('should get all types', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    const types = getAllTypes(schema);
    expect(types).toHaveLength(2);
  });

  it('should get instantiable entities', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const schema = buildFull(source);

    const instantiable = getInstantiableEntities(schema);
    const names = instantiable.map((e) => e.name);
    expect(names).toContain('cartesian_point');
    expect(names).toContain('vector');
    expect(names).toContain('direction');
    expect(names).not.toContain('point');
  });
});
