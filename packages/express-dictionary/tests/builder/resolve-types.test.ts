import type { SchemaDeclarationNode } from '@step-nc/express-parser';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
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

function buildResolved(source: string) {
  const ast = parseSchema(source);
  const { schema, diagnostics: collectDiags } = collectDeclarations(ast);
  const resolveDiags = resolveTypes(schema);
  return { schema, diagnostics: [...collectDiags, ...resolveDiags] };
}

describe('resolveTypes', () => {
  it('should resolve named type references in geometry.exp', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const { schema, diagnostics } = buildResolved(source);

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    // vector.orientation → entity direction
    const vector = schema.entities.get('VECTOR')!;
    const orientation = vector.explicitAttributes.find(
      (a) => a.name === 'orientation',
    )!;
    expect(orientation.type.kind).toBe('entity');
    if (orientation.type.kind === 'entity') {
      expect(orientation.type.entity.name).toBe('direction');
    }

    // vector.magnitude → defined type length_measure
    const magnitude = vector.explicitAttributes.find(
      (a) => a.name === 'magnitude',
    )!;
    expect(magnitude.type.kind).toBe('defined');
    if (magnitude.type.kind === 'defined') {
      expect(magnitude.type.definition.name).toBe('length_measure');
    }
  });

  it('should resolve aggregation element types', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const { schema } = buildResolved(source);

    // point.coordinates : LIST [2:3] OF length_measure
    const point = schema.entities.get('POINT')!;
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

  it('should resolve type definition underlying types', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const { schema } = buildResolved(source);

    const lengthMeasure = schema.types.get('LENGTH_MEASURE')!;
    expect(lengthMeasure.underlyingType.kind).toBe('simple');
  });

  it('should emit UNRESOLVED_TYPE for unknown references', () => {
    const { diagnostics } = buildResolved(`
      SCHEMA s;
        ENTITY e;
          x : nonexistent_type;
        END_ENTITY;
      END_SCHEMA;
    `);

    const unresolvedErrors = diagnostics.filter(
      (d) => d.code === 'UNRESOLVED_TYPE',
    );
    expect(unresolvedErrors.length).toBeGreaterThanOrEqual(1);
    expect(unresolvedErrors[0]!.message).toContain('nonexistent_type');
  });

  it('should resolve nested aggregation types', () => {
    const { schema, diagnostics } = buildResolved(`
      SCHEMA s;
        ENTITY point; END_ENTITY;
        ENTITY e;
          data : LIST [0:?] OF SET [1:?] OF point;
        END_ENTITY;
      END_SCHEMA;
    `);

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    const e = schema.entities.get('E')!;
    const data = e.explicitAttributes.find((a) => a.name === 'data')!;
    expect(data.type.kind).toBe('aggregation');
    if (data.type.kind === 'aggregation') {
      expect(data.type.aggregationKind).toBe('LIST');
      expect(data.type.elementType.kind).toBe('aggregation');
      if (data.type.elementType.kind === 'aggregation') {
        expect(data.type.elementType.aggregationKind).toBe('SET');
        expect(data.type.elementType.elementType.kind).toBe('entity');
      }
    }
  });

  it('should resolve SELECT type selections', () => {
    const { schema, diagnostics } = buildResolved(`
      SCHEMA s;
        ENTITY point; END_ENTITY;
        ENTITY vector; END_ENTITY;
        TYPE geometric_item = SELECT (point, vector); END_TYPE;
      END_SCHEMA;
    `);

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    const selectType = schema.types.get('GEOMETRIC_ITEM')!;
    expect(selectType.underlyingType.kind).toBe('select');
    if (selectType.underlyingType.kind === 'select') {
      expect(selectType.underlyingType.selections).toHaveLength(2);
      expect(selectType.underlyingType.selections[0]!.resolved).toBeDefined();
      expect(selectType.underlyingType.selections[1]!.resolved).toBeDefined();
    }
  });

  it('should resolve function parameter and return types', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const { schema, diagnostics } = buildResolved(source);

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);

    const fn = schema.functions.get('DOT_PRODUCT')!;
    expect(fn.parameters[0]!.type.kind).toBe('entity');
    expect(fn.returnType.kind).toBe('simple');
  });
});
