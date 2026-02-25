import type { SchemaDeclarationNode } from '@step-nc/express-parser';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  getAllAttributes,
  getAllEntities,
  getEntity,
  getInstantiableEntities,
  isSubtypeOf,
} from '../src';
import { buildSchema } from '../src/builder/build-schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GEOMETRY_EXP = resolve(__dirname, '../../../examples/data/geometry.exp');

function parseSchemaNode(source: string): SchemaDeclarationNode {
  const result = parseExpress(source);
  if (result.ast.type !== 'SchemaDeclaration') {
    throw new Error(`Expected SchemaDeclaration, got ${result.ast.type}`);
  }
  return result.ast;
}

describe('buildSchema (end-to-end)', () => {
  it('should build geometry.exp fully', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchemaNode(source);
    const { schema, diagnostics } = buildSchema(ast);

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    expect(schema.name).toBe('geometry');
    expect(getAllEntities(schema)).toHaveLength(4);
  });

  it('should resolve all types in geometry.exp', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchemaNode(source);
    const { schema } = buildSchema(ast);

    const vector = getEntity(schema, 'vector')!;
    const orientation = vector.explicitAttributes.find(
      (a) => a.name === 'orientation',
    )!;
    expect(orientation.type.kind).toBe('entity');
  });

  it('should build inheritance in geometry.exp', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchemaNode(source);
    const { schema } = buildSchema(ast);

    const point = getEntity(schema, 'point')!;
    const cp = getEntity(schema, 'cartesian_point')!;

    expect(isSubtypeOf(cp, point)).toBe(true);
    expect(getAllAttributes(cp).map((a) => a.name)).toContain('coordinates');
  });

  it('should compute instantiable entities correctly', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchemaNode(source);
    const { schema } = buildSchema(ast);

    const instantiable = getInstantiableEntities(schema);
    const names = instantiable.map((e) => e.name);
    expect(names).toContain('cartesian_point');
    expect(names).toContain('vector');
    expect(names).toContain('direction');
    expect(names).not.toContain('point');
  });

  it('should handle empty schema', () => {
    const ast = parseSchemaNode('SCHEMA empty; END_SCHEMA;');
    const { schema, diagnostics } = buildSchema(ast);

    expect(schema.name).toBe('empty');
    expect(schema.entities.size).toBe(0);
    expect(diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('should accumulate diagnostics from all phases', () => {
    const ast = parseSchemaNode(`
      SCHEMA s;
        ENTITY e SUBTYPE OF (nonexistent);
          x : unknown_type;
        END_ENTITY;
      END_SCHEMA;
    `);
    const { diagnostics } = buildSchema(ast);

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
