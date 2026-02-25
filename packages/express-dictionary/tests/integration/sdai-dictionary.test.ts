import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  getAllEntities,
  getEntity,
  getSupertypeChain,
  getType,
  isSubtypeOf,
} from '../../src';
import { buildSchema } from '../../src/builder/build-schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SDAI_DICTIONARY_EXP = resolve(
  __dirname,
  '../../../../docs/express/sdai/SDAI-dictionary_schema.exp',
);

function build(filePath: string) {
  const source = readFileSync(filePath, 'utf-8');
  const result = parseExpress(source);
  if (result.ast.type !== 'SchemaDeclaration') {
    throw new Error('Expected SchemaDeclaration');
  }
  return buildSchema(result.ast);
}

describe('Integration: SDAI dictionary_schema', () => {
  it('should build without unrecoverable errors', () => {
    const { schema } = build(SDAI_DICTIONARY_EXP);
    expect(schema.name).toBe('dictionary_schema');
    expect(getAllEntities(schema).length).toBeGreaterThan(10);
  });

  it('should resolve inheritance: entity_definition SUBTYPE OF named_type', () => {
    const { schema } = build(SDAI_DICTIONARY_EXP);
    const entityDef = getEntity(schema, 'entity_definition')!;
    const namedType = getEntity(schema, 'named_type')!;

    expect(isSubtypeOf(entityDef, namedType)).toBe(true);
  });

  it('should resolve SELECT type: base_type = SELECT(simple_type, aggregation_type, named_type)', () => {
    const { schema } = build(SDAI_DICTIONARY_EXP);
    const baseType = getType(schema, 'base_type')!;

    expect(baseType.underlyingType.kind).toBe('select');
    if (baseType.underlyingType.kind === 'select') {
      expect(baseType.underlyingType.selections).toHaveLength(3);
      const names = baseType.underlyingType.selections.map((s) => s.name);
      expect(names).toContain('simple_type');
      expect(names).toContain('aggregation_type');
      expect(names).toContain('named_type');
    }
  });

  it('should resolve deep hierarchy: set_type → variable_size_aggregation_type → aggregation_type', () => {
    const { schema } = build(SDAI_DICTIONARY_EXP);
    const setType = getEntity(schema, 'set_type')!;
    const varSizeAgg = getEntity(schema, 'variable_size_aggregation_type')!;
    const aggType = getEntity(schema, 'aggregation_type')!;

    expect(isSubtypeOf(setType, varSizeAgg)).toBe(true);
    expect(isSubtypeOf(setType, aggType)).toBe(true);

    const chain = getSupertypeChain(setType);
    const names = chain.map((e) => e.name);
    expect(names).toContain('variable_size_aggregation_type');
    expect(names).toContain('aggregation_type');
  });

  it('should resolve inverse: entity_definition.attributes FOR attribute.parent_entity', () => {
    const { schema } = build(SDAI_DICTIONARY_EXP);
    const entityDef = getEntity(schema, 'entity_definition')!;

    const attrsInv = entityDef.inverseAttributes.find(
      (a) => a.name === 'attributes',
    )!;
    expect(attrsInv).toBeDefined();
    expect(attrsInv.invertedEntity).toBeDefined();
    expect(attrsInv.invertedEntity!.name).toBe('attribute');
    expect(attrsInv.invertedAttribute).toBeDefined();
    expect(attrsInv.invertedAttribute!.name).toBe('parent_entity');
  });
});
