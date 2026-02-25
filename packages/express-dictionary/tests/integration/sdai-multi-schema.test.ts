import type { SchemaDeclarationNode } from '@step-nc/express-parser';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SchemaRegistry } from '../../src/registry/schema-registry';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SDAI_FILES = {
  dictionary: resolve(
    __dirname,
    '../../../../docs/express/sdai/SDAI-dictionary_schema.exp',
  ),
  population: resolve(
    __dirname,
    '../../../../docs/express/sdai/SDAI-population_schema.exp',
  ),
  session: resolve(
    __dirname,
    '../../../../docs/express/sdai/SDAI-session_schema.exp',
  ),
  parameter_data: resolve(
    __dirname,
    '../../../../docs/express/sdai/SDAI-parameter_data_schema.exp',
  ),
};

function parseFile(filePath: string): SchemaDeclarationNode {
  const source = readFileSync(filePath, 'utf-8');
  const result = parseExpress(source);
  if (result.ast.type !== 'SchemaDeclaration') {
    throw new Error(`Expected SchemaDeclaration in ${filePath}`);
  }
  return result.ast;
}

describe('Integration: SDAI multi-schema', () => {
  it('should load all 4 SDAI schemas into a registry', () => {
    const registry = new SchemaRegistry();

    registry.buildAndRegister(parseFile(SDAI_FILES.dictionary));
    registry.buildAndRegister(parseFile(SDAI_FILES.parameter_data));
    registry.buildAndRegister(parseFile(SDAI_FILES.population));
    registry.buildAndRegister(parseFile(SDAI_FILES.session));

    expect(registry.size).toBe(4);
  });

  it('should resolve inter-schema references after resolveInterfaces', () => {
    const registry = new SchemaRegistry();

    registry.buildAndRegister(parseFile(SDAI_FILES.dictionary));
    registry.buildAndRegister(parseFile(SDAI_FILES.parameter_data));
    registry.buildAndRegister(parseFile(SDAI_FILES.population));
    registry.buildAndRegister(parseFile(SDAI_FILES.session));

    const diags = registry.resolveInterfaces();

    // There may be some unresolved types depending on schema complexity,
    // but no UNRESOLVED_SCHEMA_REF should be present
    const unresolvedSchemas = diags.filter(
      (d) => d.code === 'UNRESOLVED_SCHEMA_REF',
    );
    expect(unresolvedSchemas).toHaveLength(0);
  });

  it('should resolve population_schema USE FROM dictionary_schema', () => {
    const registry = new SchemaRegistry();

    registry.buildAndRegister(parseFile(SDAI_FILES.dictionary));
    registry.buildAndRegister(parseFile(SDAI_FILES.parameter_data));
    registry.buildAndRegister(parseFile(SDAI_FILES.population));
    registry.buildAndRegister(parseFile(SDAI_FILES.session));

    registry.resolveInterfaces();

    const population = registry.get('population_schema')!;
    // population_schema uses all of dictionary_schema
    expect(population.entities.has('SCHEMA_DEFINITION')).toBe(true);
    expect(population.entities.has('ENTITY_DEFINITION')).toBe(true);
  });

  it('should resolve session_schema USE FROM population_schema', () => {
    const registry = new SchemaRegistry();

    registry.buildAndRegister(parseFile(SDAI_FILES.dictionary));
    registry.buildAndRegister(parseFile(SDAI_FILES.parameter_data));
    registry.buildAndRegister(parseFile(SDAI_FILES.population));
    registry.buildAndRegister(parseFile(SDAI_FILES.session));

    registry.resolveInterfaces();

    const session = registry.get('session_schema')!;
    // session_schema has USE FROM population_schema, which brings in sdai_model etc.
    expect(session.entities.has('SDAI_MODEL')).toBe(true);
  });
});
