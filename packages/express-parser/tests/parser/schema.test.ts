import { describe, it, expect } from 'vitest';
import { lexExpress } from '../../src/lexer/lexer';
import { ParserContext } from '../../src/parser/context';
import { parseSchema } from '../../src/parser/schema';

function parse(source: string) {
  const { tokens } = lexExpress(source);
  const ctx = new ParserContext(tokens);
  const ast = parseSchema(ctx);
  return { ast, diagnostics: ctx.diagnostics };
}

describe('parseSchema', () => {
  it('should parse minimal schema', () => {
    const { ast, diagnostics } = parse('SCHEMA my_schema; END_SCHEMA;');
    expect(diagnostics).toHaveLength(0);
    expect(ast.type).toBe('SchemaDeclaration');
    expect(ast.name).toBe('my_schema');
    expect(ast.interfaces).toHaveLength(0);
    expect(ast.declarations).toHaveLength(0);
  });

  it('should parse schema with version id', () => {
    const { ast, diagnostics } = parse("SCHEMA s1 'v1.0'; END_SCHEMA;");
    expect(diagnostics).toHaveLength(0);
    expect(ast.name).toBe('s1');
    expect(ast.versionId).toBe('v1.0');
  });

  it('should parse schema without interfaces but with version_id and several declarations', () => {
    const { ast, diagnostics } = parse(`
      SCHEMA with_version '1.0';
        TYPE t1 = INTEGER;
        END_TYPE;
        TYPE t2 = REAL;
        END_TYPE;
        ENTITY e;
          x : t1;
        END_ENTITY;
      END_SCHEMA;
    `);
    expect(diagnostics).toHaveLength(0);
    expect(ast.name).toBe('with_version');
    expect(ast.versionId).toBe('1.0');
    expect(ast.interfaces).toHaveLength(0);
    expect(ast.declarations).toHaveLength(3);
  });

  it('should parse USE clause without items', () => {
    const { ast, diagnostics } = parse(
      'SCHEMA s; USE FROM other_schema; END_SCHEMA;',
    );
    expect(diagnostics).toHaveLength(0);
    expect(ast.interfaces).toHaveLength(1);
    expect(ast.interfaces[0]!.type).toBe('UseClause');
    if (ast.interfaces[0]!.type === 'UseClause') {
      expect(ast.interfaces[0]!.schemaName).toBe('other_schema');
      expect(ast.interfaces[0]!.items).toBeUndefined();
    }
  });

  it('should parse USE clause with items', () => {
    const { ast, diagnostics } = parse(
      'SCHEMA s; USE FROM other (type1, type2); END_SCHEMA;',
    );
    expect(diagnostics).toHaveLength(0);
    const use = ast.interfaces[0]!;
    if (use.type === 'UseClause') {
      expect(use.items).toHaveLength(2);
      expect(use.items![0]!.name).toBe('type1');
      expect(use.items![1]!.name).toBe('type2');
    }
  });

  it('should parse USE clause with AS rename', () => {
    const { ast, diagnostics } = parse(
      'SCHEMA s; USE FROM other (type1 AS alias1); END_SCHEMA;',
    );
    expect(diagnostics).toHaveLength(0);
    const use = ast.interfaces[0]!;
    if (use.type === 'UseClause') {
      expect(use.items![0]!.name).toBe('type1');
      expect(use.items![0]!.alias).toBe('alias1');
    }
  });

  it('should parse REFERENCE clause', () => {
    const { ast, diagnostics } = parse(
      'SCHEMA s; REFERENCE FROM lib (res1 AS r1, res2); END_SCHEMA;',
    );
    expect(diagnostics).toHaveLength(0);
    expect(ast.interfaces).toHaveLength(1);
    const ref = ast.interfaces[0]!;
    expect(ref.type).toBe('ReferenceClause');
    if (ref.type === 'ReferenceClause') {
      expect(ref.schemaName).toBe('lib');
      expect(ref.items).toHaveLength(2);
      expect(ref.items![0]!.alias).toBe('r1');
      expect(ref.items![1]!.alias).toBeUndefined();
    }
  });

  it('should parse schema with declarations', () => {
    const { ast, diagnostics } = parse(`
      SCHEMA geometry;
        TYPE length = REAL;
        END_TYPE;

        ENTITY point;
          x : REAL;
          y : REAL;
        END_ENTITY;
      END_SCHEMA;
    `);
    expect(diagnostics).toHaveLength(0);
    expect(ast.declarations).toHaveLength(2);
    expect(ast.declarations[0]!.type).toBe('TypeDeclaration');
    expect(ast.declarations[1]!.type).toBe('EntityDeclaration');
  });

  it('should parse schema with USE, REFERENCE, and declarations', () => {
    const { ast, diagnostics } = parse(`
      SCHEMA test;
        USE FROM math_functions;
        REFERENCE FROM support (base_type AS bt);

        TYPE my_type = INTEGER;
        END_TYPE;
      END_SCHEMA;
    `);
    expect(diagnostics).toHaveLength(0);
    expect(ast.interfaces).toHaveLength(2);
    expect(ast.declarations).toHaveLength(1);
  });
});
