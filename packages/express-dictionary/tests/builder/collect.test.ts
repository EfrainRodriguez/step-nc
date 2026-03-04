import type { SchemaDeclarationNode } from '@step-nc/express-parser';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectDeclarations } from '../../src/builder/collect-declarations';

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

describe('collectDeclarations', () => {
  it('should collect declarations from geometry.exp', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchema(source);
    const { schema, diagnostics } = collectDeclarations(ast);

    expect(schema.name).toBe('geometry');
    expect(schema.entities.size).toBe(4);
    expect(schema.types.size).toBe(2);
    expect(schema.functions.size).toBe(1);
    expect(diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('should collect entity names correctly', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchema(source);
    const { schema } = collectDeclarations(ast);

    expect(schema.entities.has('POINT')).toBe(true);
    expect(schema.entities.has('CARTESIAN_POINT')).toBe(true);
    expect(schema.entities.has('VECTOR')).toBe(true);
    expect(schema.entities.has('DIRECTION')).toBe(true);
  });

  it('should preserve original casing in entity name', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchema(source);
    const { schema } = collectDeclarations(ast);

    expect(schema.entities.get('POINT')!.name).toBe('point');
    expect(schema.entities.get('CARTESIAN_POINT')!.name).toBe(
      'cartesian_point',
    );
  });

  it('should mark abstract entities', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchema(source);
    const { schema } = collectDeclarations(ast);

    expect(schema.entities.get('POINT')!.abstract).toBe(true);
    expect(schema.entities.get('CARTESIAN_POINT')!.abstract).toBe(false);
    expect(schema.entities.get('VECTOR')!.abstract).toBe(false);
  });

  it('should collect explicit attributes', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchema(source);
    const { schema } = collectDeclarations(ast);

    const point = schema.entities.get('POINT')!;
    expect(point.explicitAttributes).toHaveLength(1);
    expect(point.explicitAttributes[0]!.name).toBe('coordinates');

    const vector = schema.entities.get('VECTOR')!;
    expect(vector.explicitAttributes).toHaveLength(2);
    expect(vector.explicitAttributes.map((a) => a.name)).toEqual([
      'orientation',
      'magnitude',
    ]);
  });

  it('should collect where rules on entities', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchema(source);
    const { schema } = collectDeclarations(ast);

    const vector = schema.entities.get('VECTOR')!;
    expect(vector.whereRules).toHaveLength(1);
    expect(vector.whereRules[0]!.label).toBe('WR1');
  });

  it('should collect type definitions', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchema(source);
    const { schema } = collectDeclarations(ast);

    expect(schema.types.has('LENGTH_MEASURE')).toBe(true);
    expect(schema.types.has('PLANE_ANGLE_MEASURE')).toBe(true);

    const lengthMeasure = schema.types.get('LENGTH_MEASURE')!;
    expect(lengthMeasure.underlyingType.kind).toBe('simple');
    if (lengthMeasure.underlyingType.kind === 'simple') {
      expect(lengthMeasure.underlyingType.simpleType).toBe('REAL');
    }
  });

  it('should collect function definitions', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchema(source);
    const { schema } = collectDeclarations(ast);

    expect(schema.functions.has('DOT_PRODUCT')).toBe(true);
    const fn = schema.functions.get('DOT_PRODUCT')!;
    expect(fn.name).toBe('dot_product');
    expect(fn.parameters).toHaveLength(2);
    expect(fn.parameters[0]!.name).toBe('a');
    expect(fn.parameters[1]!.name).toBe('b');
  });

  it('should collect supertype names', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchema(source);
    const { schema } = collectDeclarations(ast);

    const cartesianPoint = schema.entities.get('CARTESIAN_POINT')!;
    expect(cartesianPoint.supertypeNames).toEqual(['point']);
  });

  it('should set back-references to schema', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const ast = parseSchema(source);
    const { schema } = collectDeclarations(ast);

    for (const entity of schema.entities.values()) {
      expect(entity.schema).toBe(schema);
    }
    for (const type of schema.types.values()) {
      expect(type.schema).toBe(schema);
    }
  });

  it('should detect duplicate declarations', () => {
    const ast = parseSchema(`
      SCHEMA s;
        TYPE t1 = INTEGER; END_TYPE;
        TYPE t1 = REAL; END_TYPE;
      END_SCHEMA;
    `);
    const { diagnostics } = collectDeclarations(ast);
    const dups = diagnostics.filter((d) => d.code === 'DUPLICATE_DECLARATION');
    expect(dups).toHaveLength(1);
    expect(dups[0]!.message).toContain('t1');
  });

  it('should expand multi-name attributes', () => {
    const ast = parseSchema(`
      SCHEMA s;
        ENTITY e;
          a, b, c : REAL;
        END_ENTITY;
      END_SCHEMA;
    `);
    const { schema } = collectDeclarations(ast);
    const entity = schema.entities.get('E')!;
    expect(entity.explicitAttributes).toHaveLength(3);
    expect(entity.explicitAttributes.map((a) => a.name)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('should collect interface clauses', () => {
    const ast = parseSchema(`
      SCHEMA s;
        USE FROM other_schema;
        REFERENCE FROM another (item1, item2);
      END_SCHEMA;
    `);
    const { schema } = collectDeclarations(ast);
    expect(schema.interfaces).toHaveLength(2);
    expect(schema.interfaces[0]!.kind).toBe('use');
    expect(schema.interfaces[0]!.schemaName).toBe('other_schema');
    expect(schema.interfaces[1]!.kind).toBe('reference');
    expect(schema.interfaces[1]!.schemaName).toBe('another');
    expect(schema.interfaces[1]!.items).toHaveLength(2);
  });

  it('should collect constants', () => {
    const ast = parseSchema(`
      SCHEMA s;
        CONSTANT
          pi : REAL := 3.14159;
        END_CONSTANT;
      END_SCHEMA;
    `);
    const { schema } = collectDeclarations(ast);
    expect(schema.constants.size).toBe(1);
    expect(schema.constants.has('PI')).toBe(true);
  });

  it('should capture redeclaredFrom for SELF\\supertype.attribute in DERIVE', () => {
    const ast = parseSchema(`
      SCHEMA s;
        ENTITY edge;
          edge_start : INTEGER;
        END_ENTITY;
        ENTITY oriented_edge SUBTYPE OF (edge);
          orientation : BOOLEAN;
        DERIVE
          SELF\\edge.edge_start : INTEGER := 42;
        END_ENTITY;
      END_SCHEMA;
    `);

    const { schema } = collectDeclarations(ast);
    const oriented = schema.entities.get('ORIENTED_EDGE')!;

    expect(oriented.derivedAttributes).toHaveLength(1);
    const derived = oriented.derivedAttributes[0]!;
    expect(derived.name).toBe('edge_start');
    expect(derived.redeclaredFrom).toBeDefined();
    expect(derived.redeclaredFrom!.entityName).toBe('edge');
    expect(derived.redeclaredFrom!.attributeName).toBe('edge_start');
  });
});
