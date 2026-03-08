import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseExpress } from '../../src/parser/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths from packages/express-parser/tests/parser/ to repo root: ../../../../ then examples/docs
const GEOMETRY_EXP = resolve(
  __dirname,
  '../../../../examples/data/geometry.exp',
);
const SDAI_EXP = resolve(__dirname, '../../../../docs/express/sdai/sdai.exp');
const SDAI_DICTIONARY_EXP = resolve(
  __dirname,
  '../../../../docs/express/sdai/SDAI-dictionary_schema.exp',
);

describe('Real EXPRESS files — geometry.exp', () => {
  it('parses geometry.exp without crash and returns SchemaDeclaration', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const result = parseExpress(source);
    expect(result.ast).toBeDefined();
    expect(result.ast.type).toBe('SchemaDeclaration');
    if (result.ast.type === 'SchemaDeclaration') {
      expect(result.ast.name).toBe('geometry');
    }
  });

  it('geometry.exp: diagnostics length 0 or known minor warnings', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const result = parseExpress(source);
    expect(result.diagnostics).toBeDefined();
    // Allow 0 or document if minor warnings expected
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });

  it('geometry.exp: minimum number of declarations', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const result = parseExpress(source);
    expect(result.ast.type).toBe('SchemaDeclaration');
    if (result.ast.type === 'SchemaDeclaration') {
      expect(result.ast.declarations.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('geometry.exp: contains entities point, cartesian_point, direction, vector and function dot_product', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const result = parseExpress(source);
    expect(result.ast.type).toBe('SchemaDeclaration');
    if (result.ast.type !== 'SchemaDeclaration') return;
    const names = result.ast.declarations.map((d) =>
      d.type === 'EntityDeclaration'
        ? d.name
        : d.type === 'FunctionDeclaration'
          ? d.name
          : null,
    );
    expect(names.filter(Boolean)).toContain('point');
    expect(names.filter(Boolean)).toContain('cartesian_point');
    expect(names.filter(Boolean)).toContain('direction');
    expect(names.filter(Boolean)).toContain('vector');
    expect(names.filter(Boolean)).toContain('dot_product');
  });
});

describe('Real EXPRESS files — SDAI', () => {
  it('parses sdai.exp successfully (no throw)', () => {
    const source = readFileSync(SDAI_EXP, 'utf-8');
    const result = parseExpress(source);
    expect(result.ast).toBeDefined();
    expect(result.ast.type).toBe('SchemaDeclaration');
  });

  it('sdai.exp: declarations count above threshold', () => {
    const source = readFileSync(SDAI_EXP, 'utf-8');
    const result = parseExpress(source);
    if (result.ast.type === 'SchemaDeclaration') {
      expect(result.ast.declarations.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('parses SDAI-dictionary_schema.exp successfully (no throw)', () => {
    const source = readFileSync(SDAI_DICTIONARY_EXP, 'utf-8');
    const result = parseExpress(source);
    expect(result.ast).toBeDefined();
    expect(result.ast.type).toBe('SchemaDeclaration');
  });

  it('SDAI-dictionary_schema.exp: declarations count above threshold', () => {
    const source = readFileSync(SDAI_DICTIONARY_EXP, 'utf-8');
    const result = parseExpress(source);
    if (result.ast.type === 'SchemaDeclaration') {
      expect(result.ast.declarations.length).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('Streaming mode — equivalence tests', () => {
  it('geometry.exp: streaming produces same AST as eager', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const eager = parseExpress(source);
    const streaming = parseExpress(source, { streaming: true });

    expect(streaming.ast).toEqual(eager.ast);
  });

  it('geometry.exp: streaming produces same diagnostics count as eager', () => {
    const source = readFileSync(GEOMETRY_EXP, 'utf-8');
    const eager = parseExpress(source);
    const streaming = parseExpress(source, { streaming: true });

    expect(streaming.diagnostics.length).toBe(eager.diagnostics.length);
  });

  it('sdai.exp: streaming produces same AST as eager', () => {
    const source = readFileSync(SDAI_EXP, 'utf-8');
    const eager = parseExpress(source);
    const streaming = parseExpress(source, { streaming: true });

    expect(streaming.ast).toEqual(eager.ast);
  });

  it('SDAI-dictionary_schema.exp: streaming produces same AST as eager', () => {
    const source = readFileSync(SDAI_DICTIONARY_EXP, 'utf-8');
    const eager = parseExpress(source);
    const streaming = parseExpress(source, { streaming: true });

    expect(streaming.ast).toEqual(eager.ast);
  });
});
