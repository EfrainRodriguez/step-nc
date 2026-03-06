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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SDAI_DICTIONARY_EXP = resolve(
  __dirname,
  '../../../../docs/express/sdai/SDAI-dictionary_schema.exp',
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
  const { schema, diagnostics: d1 } = collectDeclarations(ast);
  const d2 = resolveTypes(schema);
  const d3 = buildInheritance(schema);
  const d4 = resolveInverse(schema);
  const d5 = resolveConstraints(schema);
  return { schema, diagnostics: [...d1, ...d2, ...d3, ...d4, ...d5] };
}

describe('resolveInverse', () => {
  it('should resolve inverse attributes in SDAI dictionary schema', () => {
    const source = readFileSync(SDAI_DICTIONARY_EXP, 'utf-8');
    const { schema, diagnostics } = buildFull(source);

    const invalidInverse = diagnostics.filter(
      (d) => d.code === 'INVALID_INVERSE',
    );
    expect(invalidInverse).toHaveLength(0);

    // schema_definition has INVERSE entities : SET OF entity_definition FOR parent_schema
    const schemaDef = schema.entities.get('SCHEMA_DEFINITION')!;
    expect(schemaDef.inverseAttributes.length).toBeGreaterThan(0);

    const entitiesInv = schemaDef.inverseAttributes.find(
      (a) => a.name === 'entities',
    )!;
    expect(entitiesInv.invertedEntity).toBeDefined();
    expect(entitiesInv.invertedEntity!.name).toBe('entity_definition');
    expect(entitiesInv.invertedAttribute).toBeDefined();
    expect(entitiesInv.invertedAttribute!.name).toBe('parent_schema');
  });

  it('should resolve entity_definition.attributes inverse', () => {
    const source = readFileSync(SDAI_DICTIONARY_EXP, 'utf-8');
    const { schema } = buildFull(source);

    const entityDef = schema.entities.get('ENTITY_DEFINITION')!;
    const attrsInv = entityDef.inverseAttributes.find(
      (a) => a.name === 'attributes',
    )!;
    expect(attrsInv.invertedEntity!.name).toBe('attribute');
    expect(attrsInv.invertedAttribute!.name).toBe('parent_entity');
  });

  it('should emit INVALID_INVERSE for bad references', () => {
    const { diagnostics } = buildFull(`
      SCHEMA s;
        ENTITY a;
          x : REAL;
        END_ENTITY;
        ENTITY b;
        INVERSE
          ref : a FOR nonexistent_attr;
        END_ENTITY;
      END_SCHEMA;
    `);

    const invalid = diagnostics.filter((d) => d.code === 'INVALID_INVERSE');
    expect(invalid.length).toBeGreaterThanOrEqual(1);
  });

  it('should emit INVALID_INVERSE for references to non-existent entity', () => {
    const { diagnostics } = buildFull(`
      SCHEMA s;
        ENTITY b;
        INVERSE
          ref : nonexistent_entity FOR some_attr;
        END_ENTITY;
      END_SCHEMA;
    `);

    const invalid = diagnostics.filter((d) => d.code === 'INVALID_INVERSE');
    expect(invalid.length).toBeGreaterThanOrEqual(1);
  });
});

describe('resolveConstraints', () => {
  it('should resolve unique rule attributes in SDAI dictionary schema', () => {
    const source = readFileSync(SDAI_DICTIONARY_EXP, 'utf-8');
    const { schema } = buildFull(source);

    const schemaDef = schema.entities.get('SCHEMA_DEFINITION')!;
    expect(schemaDef.uniqueRules).toHaveLength(1);
    expect(schemaDef.uniqueRules[0]!.label).toBe('UR1');
    expect(schemaDef.uniqueRules[0]!.resolvedAttributes).toBeDefined();
  });

  it('should warn about unknown attribute in unique rule', () => {
    const { diagnostics } = buildFull(`
      SCHEMA s;
        ENTITY e;
          x : REAL;
        UNIQUE
          UR1 : x, nonexistent;
        END_ENTITY;
      END_SCHEMA;
    `);

    const warns = diagnostics.filter(
      (d) => d.severity === 'warning' && d.message.includes('nonexistent'),
    );
    expect(warns).toHaveLength(1);
    expect(warns[0]!.code).toBe('UNRESOLVED_ATTRIBUTE_REF');
  });

  it('should resolve unique rule attributes inherited from supertypes', () => {
    const { schema, diagnostics } = buildFull(`
      SCHEMA s;
        ENTITY base;
          id : INTEGER;
        END_ENTITY;
        ENTITY child
          SUBTYPE OF (base);
        UNIQUE
          UR1 : id;
        END_ENTITY;
      END_SCHEMA;
    `);

    expect(diagnostics).toHaveLength(0);

    const child = schema.entities.get('CHILD')!;
    expect(child.uniqueRules).toHaveLength(1);
    expect(child.uniqueRules[0]!.resolvedAttributes).toEqual([{ name: 'id' }]);
  });

  it('should resolve unique rule with mix of own and inherited attributes', () => {
    const { schema, diagnostics } = buildFull(`
      SCHEMA s;
        ENTITY parent;
          code : STRING;
        END_ENTITY;
        ENTITY child
          SUBTYPE OF (parent);
          name : STRING;
        UNIQUE
          UR1 : code, name;
        END_ENTITY;
      END_SCHEMA;
    `);

    expect(diagnostics).toHaveLength(0);

    const child = schema.entities.get('CHILD')!;
    expect(child.uniqueRules).toHaveLength(1);
    expect(child.uniqueRules[0]!.resolvedAttributes).toEqual([
      { name: 'code' },
      { name: 'name' },
    ]);
  });

  it('should resolve unique rule attributes through multi-level inheritance', () => {
    const { schema, diagnostics } = buildFull(`
      SCHEMA s;
        ENTITY grandparent;
          id : INTEGER;
        END_ENTITY;
        ENTITY parent
          SUBTYPE OF (grandparent);
        END_ENTITY;
        ENTITY child
          SUBTYPE OF (parent);
        UNIQUE
          UR1 : id;
        END_ENTITY;
      END_SCHEMA;
    `);

    expect(diagnostics).toHaveLength(0);

    const child = schema.entities.get('CHILD')!;
    expect(child.uniqueRules).toHaveLength(1);
    expect(child.uniqueRules[0]!.resolvedAttributes).toEqual([{ name: 'id' }]);
  });

  it('should build AP203 with zero diagnostics', () => {
    const ap203Path = resolve(
      __dirname,
      '../../../../docs/express/APs/ap203.exp',
    );
    const source = readFileSync(ap203Path, 'utf-8');
    const { diagnostics } = buildFull(source);

    expect(diagnostics).toHaveLength(0);
  });
});
