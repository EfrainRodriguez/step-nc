import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Token, TokenKind } from '../src/index';
import { lexExpress } from '../src/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Test helpers ─────────────────────────────────────────────────

function tokenKinds(source: string): TokenKind[] {
  const { tokens } = lexExpress(source);
  return tokens.filter((t) => t.kind !== 'EOF').map((t) => t.kind);
}

function firstToken(source: string): Token {
  const { tokens } = lexExpress(source);
  return tokens[0]!;
}

// ── Tests ────────────────────────────────────────────────────────

describe('lexExpress', () => {
  // ─── Whitespace y comentarios ──────────────────────────────────

  describe('Whitespace y comentarios', () => {
    it('ignora espacios, tabs y newlines (solo produce EOF)', () => {
      const kinds = tokenKinds('  \t\n\r\n  ');
      expect(kinds).toEqual([]);
    });

    it('ignora line comments (--)', () => {
      const kinds = tokenKinds('-- esto es un comentario\n');
      expect(kinds).toEqual([]);
    });

    it('ignora block comments (* ... *)', () => {
      const kinds = tokenKinds('(* bloque de comentario *)');
      expect(kinds).toEqual([]);
    });

    it('reporta error en block comment sin cerrar', () => {
      const { diagnostics } = lexExpress('(* sin cerrar');
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]!.code).toBe('LEX003');
    });
  });

  // ─── Literales numéricos ───────────────────────────────────────

  describe('Literales numéricos', () => {
    it('entero simple → LIT_INTEGER', () => {
      const t = firstToken('7');
      expect(t.kind).toBe('LIT_INTEGER');
      expect(t.text).toBe('7');
    });

    it('entero con múltiples dígitos → LIT_INTEGER', () => {
      const t = firstToken('42');
      expect(t.kind).toBe('LIT_INTEGER');
      expect(t.text).toBe('42');
    });

    it('real con parte decimal → LIT_REAL', () => {
      const t = firstToken('3.14');
      expect(t.kind).toBe('LIT_REAL');
      expect(t.text).toBe('3.14');
    });

    it('real terminado en punto (ej: 3.) → LIT_REAL', () => {
      const t = firstToken('3.');
      expect(t.kind).toBe('LIT_REAL');
      expect(t.text).toBe('3.');
    });

    it('posición (offset, line, column) correcta', () => {
      const { tokens } = lexExpress('  42');
      const t = tokens[0]!;
      expect(t.offset).toBe(2);
      expect(t.line).toBe(1);
      expect(t.column).toBe(3);
    });
  });

  // ─── Literales de string ───────────────────────────────────────

  describe('Literales de string', () => {
    it('string simple → LIT_STRING', () => {
      const t = firstToken("'hello'");
      expect(t.kind).toBe('LIT_STRING');
      expect(t.text).toBe("'hello'");
    });

    it("string vacío '' → LIT_STRING", () => {
      const t = firstToken("''");
      expect(t.kind).toBe('LIT_STRING');
      expect(t.text).toBe("''");
    });

    it('reporta error en string sin cerrar', () => {
      const { diagnostics } = lexExpress("'sin cerrar");
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]!.code).toBe('LEX002');
    });
  });

  // ─── Literales binarios ────────────────────────────────────────

  describe('Literales binarios', () => {
    it('%0 → LIT_BINARY', () => {
      const t = firstToken('%0');
      expect(t.kind).toBe('LIT_BINARY');
      expect(t.text).toBe('%0');
    });

    it('%01101 → LIT_BINARY', () => {
      const t = firstToken('%01101');
      expect(t.kind).toBe('LIT_BINARY');
      expect(t.text).toBe('%01101');
    });

    it('% solo → SYM_PERCENT (fallback)', () => {
      const t = firstToken('%');
      expect(t.kind).toBe('SYM_PERCENT');
    });

    it('%ABC → SYM_PERCENT + IDENT (no es binario)', () => {
      const kinds = tokenKinds('%ABC');
      expect(kinds).toEqual(['SYM_PERCENT', 'IDENT']);
    });

    it('posición correcta', () => {
      const { tokens } = lexExpress('  %01101');
      const t = tokens[0]!;
      expect(t.offset).toBe(2);
      expect(t.line).toBe(1);
      expect(t.column).toBe(3);
    });
  });

  // ─── Identificadores ──────────────────────────────────────────

  describe('Identificadores', () => {
    it('identificador simple → IDENT', () => {
      const t = firstToken('foo');
      expect(t.kind).toBe('IDENT');
      expect(t.text).toBe('foo');
    });

    it('identificador con underscore → IDENT', () => {
      const t = firstToken('my_var');
      expect(t.kind).toBe('IDENT');
      expect(t.text).toBe('my_var');
    });

    it('identificador que empieza con underscore → IDENT', () => {
      const t = firstToken('_private');
      expect(t.kind).toBe('IDENT');
      expect(t.text).toBe('_private');
    });

    it('identificador con dígitos → IDENT', () => {
      const t = firstToken('x2');
      expect(t.kind).toBe('IDENT');
      expect(t.text).toBe('x2');
    });

    it('identifiers preserve original case (not interned)', () => {
      expect(firstToken('MyEntity').text).toBe('MyEntity');
      expect(firstToken('some_var').text).toBe('some_var');
      expect(firstToken('MixedCase').text).toBe('MixedCase');
    });
  });

  // ─── Keywords ──────────────────────────────────────────────────

  describe('Keywords', () => {
    it('keywords de lenguaje', () => {
      expect(firstToken('ENTITY').kind).toBe('KW_ENTITY');
      expect(firstToken('TYPE').kind).toBe('KW_TYPE');
      expect(firstToken('SCHEMA').kind).toBe('KW_SCHEMA');
      expect(firstToken('END_ENTITY').kind).toBe('KW_END_ENTITY');
      expect(firstToken('END_TYPE').kind).toBe('KW_END_TYPE');
      expect(firstToken('END_SCHEMA').kind).toBe('KW_END_SCHEMA');
      expect(firstToken('SELECT').kind).toBe('KW_SELECT');
      expect(firstToken('WHERE').kind).toBe('KW_WHERE');
      expect(firstToken('FUNCTION').kind).toBe('KW_FUNCTION');
      expect(firstToken('PROCEDURE').kind).toBe('KW_PROCEDURE');
    });

    it('case-insensitive (entity, Entity, ENTITY → KW_ENTITY)', () => {
      expect(firstToken('entity').kind).toBe('KW_ENTITY');
      expect(firstToken('Entity').kind).toBe('KW_ENTITY');
      expect(firstToken('ENTITY').kind).toBe('KW_ENTITY');
      expect(firstToken('eNtItY').kind).toBe('KW_ENTITY');
    });

    it('keyword interning: all keyword variants emit canonical uppercase lexeme', () => {
      expect(firstToken('entity').text).toBe('ENTITY');
      expect(firstToken('Entity').text).toBe('ENTITY');
      expect(firstToken('ENTITY').text).toBe('ENTITY');
      expect(firstToken('eNtItY').text).toBe('ENTITY');

      expect(firstToken('type').text).toBe('TYPE');
      expect(firstToken('select').text).toBe('SELECT');
      expect(firstToken('and').text).toBe('AND');
      expect(firstToken('true').text).toBe('TRUE');
      expect(firstToken('sizeof').text).toBe('SIZEOF');
    });

    it('operator keywords (AND, OR, NOT, DIV, MOD)', () => {
      expect(firstToken('AND').kind).toBe('OP_AND');
      expect(firstToken('OR').kind).toBe('OP_OR');
      expect(firstToken('NOT').kind).toBe('OP_NOT');
      expect(firstToken('DIV').kind).toBe('OP_DIV');
      expect(firstToken('MOD').kind).toBe('OP_MOD');
      expect(firstToken('XOR').kind).toBe('OP_XOR');
      expect(firstToken('IN').kind).toBe('OP_IN');
      expect(firstToken('LIKE').kind).toBe('OP_LIKE');
    });

    it('builtin constants (TRUE, FALSE, UNKNOWN, SELF, PI, CONST_E)', () => {
      expect(firstToken('TRUE').kind).toBe('BC_TRUE');
      expect(firstToken('FALSE').kind).toBe('BC_FALSE');
      expect(firstToken('UNKNOWN').kind).toBe('BC_UNKNOWN');
      expect(firstToken('SELF').kind).toBe('BC_SELF');
      expect(firstToken('PI').kind).toBe('BC_PI');
      expect(firstToken('CONST_E').kind).toBe('BC_CONST_E');
    });

    it('builtin functions (ABS, SIZEOF, TYPEOF)', () => {
      expect(firstToken('ABS').kind).toBe('BF_ABS');
      expect(firstToken('SIZEOF').kind).toBe('BF_SIZEOF');
      expect(firstToken('TYPEOF').kind).toBe('BF_TYPEOF');
      expect(firstToken('EXISTS').kind).toBe('BF_EXISTS');
      expect(firstToken('SQRT').kind).toBe('BF_SQRT');
      expect(firstToken('LENGTH').kind).toBe('BF_LENGTH');
    });

    it('builtin procedures (INSERT, REMOVE)', () => {
      expect(firstToken('INSERT').kind).toBe('BP_INSERT');
      expect(firstToken('REMOVE').kind).toBe('BP_REMOVE');
    });
  });

  // ─── Símbolos ──────────────────────────────────────────────────

  describe('Símbolos', () => {
    it('símbolos simples', () => {
      expect(firstToken('.').kind).toBe('SYM_DOT');
      expect(firstToken(',').kind).toBe('SYM_COMMA');
      expect(firstToken(';').kind).toBe('SYM_SEMICOLON');
      expect(firstToken(':').kind).toBe('SYM_COLON');
      expect(firstToken('+').kind).toBe('SYM_PLUS');
      expect(firstToken('-').kind).toBe('SYM_MINUS');
      expect(firstToken('*').kind).toBe('SYM_STAR');
      expect(firstToken('/').kind).toBe('SYM_SLASH');
      expect(firstToken('=').kind).toBe('SYM_EQUAL');
      expect(firstToken('<').kind).toBe('SYM_LESS');
      expect(firstToken('>').kind).toBe('SYM_GREATER');
      expect(firstToken('(').kind).toBe('SYM_LPAREN');
      expect(firstToken(')').kind).toBe('SYM_RPAREN');
      expect(firstToken('[').kind).toBe('SYM_LBRACKET');
      expect(firstToken(']').kind).toBe('SYM_RBRACKET');
      expect(firstToken('{').kind).toBe('SYM_LBRACE');
      expect(firstToken('}').kind).toBe('SYM_RBRACE');
      expect(firstToken('\\').kind).toBe('SYM_BACKSLASH');
      expect(firstToken('|').kind).toBe('SYM_PIPE');
    });

    it('símbolos multi-carácter', () => {
      expect(firstToken(':=').kind).toBe('SYM_ASSIGN');
      expect(firstToken('<>').kind).toBe('SYM_NOT_EQUAL');
      expect(firstToken('<=').kind).toBe('SYM_LESS_EQUAL');
      expect(firstToken('>=').kind).toBe('SYM_GREATER_EQUAL');
      expect(firstToken('**').kind).toBe('SYM_EXPONENT');
      expect(firstToken('||').kind).toBe('SYM_OR_OR');
      expect(firstToken('<*').kind).toBe('SYM_SUBTYPE_MARK');
      expect(firstToken(':=:').kind).toBe('SYM_ASSIGN_EXT');
      expect(firstToken(':<>:').kind).toBe('SYM_NOT_EQUAL_EXT');
    });

    it('longest-match: := no se parte en : y =', () => {
      const kinds = tokenKinds(':=');
      expect(kinds).toEqual(['SYM_ASSIGN']);
    });

    it('longest-match: :<>: no se parte en : y <> y :', () => {
      const kinds = tokenKinds(':<>:');
      expect(kinds).toEqual(['SYM_NOT_EQUAL_EXT']);
    });
  });

  // ─── Builtin ? ─────────────────────────────────────────────────

  describe('Builtin ?', () => {
    it('? → BC_QUESTION_MARK', () => {
      const t = firstToken('?');
      expect(t.kind).toBe('BC_QUESTION_MARK');
      expect(t.text).toBe('?');
    });
  });

  // ─── Token EOF ─────────────────────────────────────────────────

  describe('Token EOF', () => {
    it('string vacío produce solo EOF', () => {
      const { tokens } = lexExpress('');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.kind).toBe('EOF');
    });

    it('EOF siempre es el último token', () => {
      const { tokens } = lexExpress('ENTITY foo;');
      const last = tokens[tokens.length - 1]!;
      expect(last.kind).toBe('EOF');
    });
  });

  // ─── Posición (line/column tracking) ───────────────────────────

  describe('Posición (line/column tracking)', () => {
    it('offset correcto en tokens secuenciales', () => {
      const { tokens } = lexExpress('A B');
      expect(tokens[0]!.offset).toBe(0);
      expect(tokens[1]!.offset).toBe(2);
    });

    it('line incrementa con \\n', () => {
      const { tokens } = lexExpress('A\nB');
      expect(tokens[0]!.line).toBe(1);
      expect(tokens[1]!.line).toBe(2);
    });

    it('column resetea después de \\n', () => {
      const { tokens } = lexExpress('A\nB');
      expect(tokens[0]!.column).toBe(1);
      expect(tokens[1]!.column).toBe(1);
    });
  });

  // ─── Caracteres inesperados ────────────────────────────────────

  describe('Caracteres inesperados', () => {
    it('carácter desconocido genera diagnóstico LEX001', () => {
      const { diagnostics } = lexExpress('`');
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]!.code).toBe('LEX001');
    });

    it('el lexer continúa después del error', () => {
      const { tokens, diagnostics } = lexExpress('` ENTITY');
      expect(diagnostics).toHaveLength(1);
      const kinds = tokens.filter((t) => t.kind !== 'EOF').map((t) => t.kind);
      expect(kinds).toContain('KW_ENTITY');
    });
  });

  // ─── Integración: archivo EXPRESS completo ─────────────────────

  describe('Integración: archivo EXPRESS completo', () => {
    const fixturePath = resolve(
      __dirname,
      '../../../examples/data/geometry.exp',
    );
    const source = readFileSync(fixturePath, 'utf-8');

    it('tokeniza geometry.exp sin errores (diagnostics vacío)', () => {
      const { diagnostics } = lexExpress(source);
      expect(diagnostics).toEqual([]);
    });

    it('produce la secuencia esperada de tokens clave', () => {
      const kinds = tokenKinds(source);

      expect(kinds[0]).toBe('KW_SCHEMA');
      expect(kinds[1]).toBe('IDENT'); // geometry
      expect(kinds[2]).toBe('SYM_SEMICOLON');

      expect(kinds).toContain('KW_TYPE');
      expect(kinds).toContain('KW_END_TYPE');
      expect(kinds).toContain('KW_ENTITY');
      expect(kinds).toContain('KW_END_ENTITY');
      expect(kinds).toContain('KW_FUNCTION');
      expect(kinds).toContain('KW_END_FUNCTION');
      expect(kinds).toContain('KW_END_SCHEMA');
      expect(kinds).toContain('KW_WHERE');
      expect(kinds).toContain('KW_LOCAL');
      expect(kinds).toContain('KW_END_LOCAL');
      expect(kinds).toContain('KW_REPEAT');
      expect(kinds).toContain('KW_END_REPEAT');
      expect(kinds).toContain('KW_RETURN');
      expect(kinds).toContain('BF_SIZEOF');
      expect(kinds).toContain('SYM_ASSIGN');
      expect(kinds).toContain('LIT_REAL'); // 0.0
    });
  });
});
