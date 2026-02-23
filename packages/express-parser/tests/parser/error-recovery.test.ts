import { describe, expect, it } from 'vitest';
import { parseExpress } from '../../src/parser/parser';

describe('Error recovery', () => {
  describe('Missing semicolons', () => {
    it('should recover from missing semicolon after entity attribute', () => {
      const source = `
        SCHEMA s;
          ENTITY foo;
            x : REAL
            y : INTEGER;
          END_ENTITY;
        END_SCHEMA;
      `;
      const { ast, diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics.some((d) => d.code === 'PAR050')).toBe(true);
      expect(ast.declarations).toHaveLength(1);
      expect(ast.declarations[0]!.type).toBe('EntityDeclaration');
    });

    it('should recover from missing semicolon after TYPE', () => {
      const source = `
        SCHEMA s;
          TYPE len = REAL
          END_TYPE;
        END_SCHEMA;
      `;
      const { ast, diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(ast.declarations).toHaveLength(1);
    });
  });

  describe('Missing END_* keywords', () => {
    it('should recover when END_ENTITY is missing and next declaration starts', () => {
      const source = `
        SCHEMA s;
          ENTITY foo;
            x : REAL;
          ENTITY bar;
            y : INTEGER;
          END_ENTITY;
        END_SCHEMA;
      `;
      const { ast, diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(ast.declarations.length).toBeGreaterThanOrEqual(1);
    });

    it('should recover from missing END_FUNCTION with next declaration', () => {
      const source = `
        SCHEMA s;
          FUNCTION f(x : INTEGER) : INTEGER; RETURN (x);
          ENTITY e;
            a : INTEGER;
          END_ENTITY;
        END_SCHEMA;
      `;
      const { ast, diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
      expect(ast.declarations.length).toBeGreaterThanOrEqual(1);
    });

    it('should recover from missing END_PROCEDURE with next declaration', () => {
      const source = `
        SCHEMA s;
          PROCEDURE p(x : INTEGER); x := 1;
          ENTITY e;
            a : INTEGER;
          END_ENTITY;
        END_SCHEMA;
      `;
      const { ast, diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
      expect(ast.declarations.length).toBeGreaterThanOrEqual(1);
    });

    it('should recover from missing END_RULE with next declaration', () => {
      const source = `
        SCHEMA s;
          RULE r FOR (e); WHERE wr1 : TRUE;
          ENTITY e;
            a : INTEGER;
          END_ENTITY;
        END_SCHEMA;
      `;
      const { ast, diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
      expect(ast.declarations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Unexpected tokens in schema body', () => {
    it('should skip unexpected tokens and continue parsing declarations', () => {
      const source = `
        SCHEMA s;
          123;
          ENTITY point;
            x : REAL;
          END_ENTITY;
        END_SCHEMA;
      `;
      const { ast, diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThan(0);
      const entityDecls = ast.declarations.filter(
        (d) => d.type === 'EntityDeclaration',
      );
      expect(entityDecls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Multiple errors accumulated', () => {
    it('should accumulate multiple diagnostics without stopping', () => {
      const source = `
        SCHEMA s;
          TYPE t1 = REAL
          END_TYPE;
          TYPE t2 = INTEGER
          END_TYPE;
        END_SCHEMA;
      `;
      const { ast, diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(2);
      expect(ast.declarations).toHaveLength(2);
    });
  });

  describe('Schema without END_SCHEMA', () => {
    it('should report missing END_SCHEMA', () => {
      const source = 'SCHEMA s;';
      const { diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThan(0);
    });
  });

  describe('Empty bodies are valid', () => {
    it('should parse empty entity without spurious errors', () => {
      const source = `
        SCHEMA s;
          ENTITY empty;
          END_ENTITY;
        END_SCHEMA;
      `;
      const { ast, diagnostics } = parseExpress(source);
      expect(diagnostics).toHaveLength(0);
      expect(ast.declarations).toHaveLength(1);
      if (ast.declarations[0]!.type === 'EntityDeclaration') {
        expect(ast.declarations[0]!.attributes).toHaveLength(0);
      }
    });

    it('should parse empty function body without errors', () => {
      const source = `
        SCHEMA s;
          FUNCTION f(x : INTEGER) : INTEGER;
          END_FUNCTION;
        END_SCHEMA;
      `;
      const { ast, diagnostics } = parseExpress(source);
      expect(diagnostics).toHaveLength(0);
      if (ast.declarations[0]!.type === 'FunctionDeclaration') {
        expect(ast.declarations[0]!.body).toHaveLength(0);
      }
    });
  });

  describe('Expression error recovery', () => {
    it('should recover from malformed expression in assignment', () => {
      const source = `
        SCHEMA s;
          FUNCTION f(x : INTEGER) : INTEGER;
            x := ;
            RETURN (x);
          END_FUNCTION;
        END_SCHEMA;
      `;
      const { diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThan(0);
    });

    it('should recover from binary operator without right operand (x := a + ;)', () => {
      const source = `
        SCHEMA s;
          FUNCTION f() : INTEGER;
            x := a + ;
            RETURN (0);
          END_FUNCTION;
        END_SCHEMA;
      `;
      const { diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    });

    it('should recover from unclosed parenthesis in expression (x := (1 + 2;)', () => {
      const source = `
        SCHEMA s;
          FUNCTION f() : INTEGER;
            x := (1 + 2;
            RETURN (0);
          END_FUNCTION;
        END_SCHEMA;
      `;
      const { diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Type error recovery', () => {
    it('should recover from invalid type in attribute', () => {
      const source = `
        SCHEMA s;
          ENTITY foo;
            x : ;
            y : REAL;
          END_ENTITY;
        END_SCHEMA;
      `;
      const { diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThan(0);
    });
  });

  describe('Parenthesis mismatch recovery', () => {
    it('should handle missing closing paren in function params', () => {
      const source = `
        SCHEMA s;
          FUNCTION f(x : REAL : REAL;
          END_FUNCTION;
        END_SCHEMA;
      `;
      const { diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThan(0);
    });
  });

  describe('Statement malformed', () => {
    it('should recover from IF without THEN or END_IF', () => {
      const source = `
        SCHEMA s;
          FUNCTION f() : INTEGER;
            IF x > 0
            RETURN (0);
          END_FUNCTION;
        END_SCHEMA;
      `;
      const { diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    });

    it('should recover from REPEAT without END_REPEAT with next declaration', () => {
      const source = `
        SCHEMA s;
          FUNCTION f() : INTEGER;
            REPEAT i := 1 TO 10; x := 1;
          END_FUNCTION;
        END_SCHEMA;
      `;
      const { diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Invalid type in aggregation', () => {
    it('should recover from LIST OF ; (missing element type)', () => {
      const source = `
        SCHEMA s;
          ENTITY foo;
            x : LIST OF ;
          END_ENTITY;
        END_SCHEMA;
      `;
      const { diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Multiple errors in one entity', () => {
    it('should accumulate diagnostics for multiple missing semicolons in one entity', () => {
      const source = `
        SCHEMA s;
          ENTITY foo;
            a : INTEGER
            b : REAL
            c : STRING;
          END_ENTITY;
        END_SCHEMA;
      `;
      const { ast, diagnostics } = parseExpress(source);
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
      expect(ast.declarations.length).toBeGreaterThanOrEqual(1);
    });
  });
});
