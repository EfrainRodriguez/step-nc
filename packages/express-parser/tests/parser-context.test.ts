import { describe, it, expect } from 'vitest';
import { ParserContext } from '../src/parser/parser-context';
import {
  tokenStart,
  tokenEnd,
  spanOfToken,
  spanFromTokens,
} from '../src/parser/types';
import type { Token, TokenKind } from '../src/lexer/types';

// ── Test helpers ─────────────────────────────────────────────────

let nextOffset = 0;

function makeToken(kind: TokenKind, text: string): Token {
  const token: Token = {
    kind,
    text,
    offset: nextOffset,
    line: 1,
    column: nextOffset + 1,
  };
  nextOffset += text.length + 1;
  return token;
}

function makeTokens(...specs: [TokenKind, string][]): Token[] {
  nextOffset = 0;
  const tokens = specs.map(([kind, text]) => makeToken(kind, text));
  const eof: Token = {
    kind: 'EOF',
    text: '',
    offset: nextOffset,
    line: 1,
    column: nextOffset + 1,
  };
  return [...tokens, eof];
}

function eofOnly(): Token[] {
  nextOffset = 0;
  return [{ kind: 'EOF', text: '', offset: 0, line: 1, column: 1 }];
}

// ── Tests ────────────────────────────────────────────────────────

describe('ParserContext', () => {
  // ─── Suite 1: Navegación básica ─────────────────────────────────

  describe('Navegación básica', () => {
    it('peek() retorna el primer token sin consumirlo', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY'], ['IDENT', 'foo']);
      const ctx = new ParserContext(tokens);

      expect(ctx.peek().kind).toBe('KW_ENTITY');
      expect(ctx.peek().kind).toBe('KW_ENTITY');
    });

    it('peek() retorna EOF en array vacío (solo EOF)', () => {
      const ctx = new ParserContext(eofOnly());
      expect(ctx.peek().kind).toBe('EOF');
    });

    it('peek(1) retorna el segundo token (lookahead)', () => {
      const tokens = makeTokens(
        ['KW_ENTITY', 'ENTITY'],
        ['IDENT', 'foo'],
        ['SYM_SEMICOLON', ';'],
      );
      const ctx = new ParserContext(tokens);

      expect(ctx.peek(0).kind).toBe('KW_ENTITY');
      expect(ctx.peek(1).kind).toBe('IDENT');
      expect(ctx.peek(2).kind).toBe('SYM_SEMICOLON');
    });

    it('peek(offset) fuera de rango retorna EOF', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      expect(ctx.peek(99).kind).toBe('EOF');
    });

    it('consume() retorna el token actual y avanza', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY'], ['IDENT', 'foo']);
      const ctx = new ParserContext(tokens);

      const consumed = ctx.consume();
      expect(consumed.kind).toBe('KW_ENTITY');
      expect(ctx.peek().kind).toBe('IDENT');
    });

    it('consume() múltiple avanza secuencialmente', () => {
      const tokens = makeTokens(
        ['KW_ENTITY', 'ENTITY'],
        ['IDENT', 'foo'],
        ['SYM_SEMICOLON', ';'],
      );
      const ctx = new ParserContext(tokens);

      expect(ctx.consume().kind).toBe('KW_ENTITY');
      expect(ctx.consume().kind).toBe('IDENT');
      expect(ctx.consume().kind).toBe('SYM_SEMICOLON');
      expect(ctx.peek().kind).toBe('EOF');
    });

    it('current() es equivalente a peek(0)', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY'], ['IDENT', 'foo']);
      const ctx = new ParserContext(tokens);

      expect(ctx.current()).toEqual(ctx.peek(0));
      ctx.consume();
      expect(ctx.current()).toEqual(ctx.peek(0));
    });
  });

  // ─── Suite 2: check y skip ──────────────────────────────────────

  describe('check y skip', () => {
    it('check(kind) retorna true si coincide, sin consumir', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      expect(ctx.check('KW_ENTITY')).toBe(true);
      expect(ctx.peek().kind).toBe('KW_ENTITY');
    });

    it('check(kind) retorna false si no coincide', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      expect(ctx.check('KW_TYPE')).toBe(false);
    });

    it('skip(kind) retorna true y consume si coincide', () => {
      const tokens = makeTokens(
        ['SYM_SEMICOLON', ';'],
        ['KW_ENTITY', 'ENTITY'],
      );
      const ctx = new ParserContext(tokens);

      expect(ctx.skip('SYM_SEMICOLON')).toBe(true);
      expect(ctx.peek().kind).toBe('KW_ENTITY');
    });

    it('skip(kind) retorna false y no consume si no coincide', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      expect(ctx.skip('SYM_SEMICOLON')).toBe(false);
      expect(ctx.peek().kind).toBe('KW_ENTITY');
    });
  });

  // ─── Suite 3: expect ────────────────────────────────────────────

  describe('expect', () => {
    it('expect(kind) consume y retorna el token si coincide', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY'], ['IDENT', 'foo']);
      const ctx = new ParserContext(tokens);

      const token = ctx.expect('KW_ENTITY');
      expect(token.kind).toBe('KW_ENTITY');
      expect(ctx.peek().kind).toBe('IDENT');
    });

    it('expect(kind) registra diagnóstico si no coincide', () => {
      const tokens = makeTokens(['IDENT', 'foo'], ['SYM_SEMICOLON', ';']);
      const ctx = new ParserContext(tokens);

      ctx.expect('KW_ENTITY');
      expect(ctx.diagnostics).toHaveLength(1);
      expect(ctx.diagnostics[0]!.severity).toBe('error');
    });

    it('expect(kind) NO consume el token cuando hay error', () => {
      const tokens = makeTokens(['IDENT', 'foo'], ['SYM_SEMICOLON', ';']);
      const ctx = new ParserContext(tokens);

      ctx.expect('KW_ENTITY');
      expect(ctx.peek().kind).toBe('IDENT');
    });

    it('diagnóstico de expect tiene código, mensaje y span correctos', () => {
      const tokens = makeTokens(['IDENT', 'foo']);
      const ctx = new ParserContext(tokens);

      ctx.expect('KW_ENTITY');

      const diag = ctx.diagnostics[0]!;
      expect(diag.code).toBe('PAR001');
      expect(diag.message).toContain('KW_ENTITY');
      expect(diag.message).toContain('IDENT');
      expect(diag.span.start.offset).toBe(tokens[0]!.offset);
      expect(diag.span.end.offset).toBe(
        tokens[0]!.offset + tokens[0]!.text.length,
      );
    });
  });

  // ─── Suite 4: EOF ───────────────────────────────────────────────

  describe('EOF', () => {
    it('isEOF() retorna false al inicio con tokens', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      expect(ctx.isEOF()).toBe(false);
    });

    it('isEOF() retorna true cuando se llega al EOF', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      ctx.consume();
      expect(ctx.isEOF()).toBe(true);
    });

    it('consume() en EOF retorna el token EOF sin avanzar más allá', () => {
      const ctx = new ParserContext(eofOnly());

      const t1 = ctx.consume();
      const t2 = ctx.consume();
      expect(t1.kind).toBe('EOF');
      expect(t2.kind).toBe('EOF');
      expect(t1).toBe(t2);
    });

    it('peek() en EOF siempre retorna EOF', () => {
      const ctx = new ParserContext(eofOnly());

      expect(ctx.peek().kind).toBe('EOF');
      expect(ctx.peek(0).kind).toBe('EOF');
      expect(ctx.peek(5).kind).toBe('EOF');
    });
  });

  // ─── Suite 5: Diagnósticos ──────────────────────────────────────

  describe('Diagnósticos', () => {
    it('error() acumula en diagnostics con severity error', () => {
      const ctx = new ParserContext(eofOnly());
      const span = {
        start: { offset: 0, line: 1, column: 1 },
        end: { offset: 5, line: 1, column: 6 },
      };

      ctx.error('PAR099', 'test error', span);

      expect(ctx.diagnostics).toHaveLength(1);
      expect(ctx.diagnostics[0]!.severity).toBe('error');
      expect(ctx.diagnostics[0]!.code).toBe('PAR099');
      expect(ctx.diagnostics[0]!.message).toBe('test error');
    });

    it('warning() acumula con severity warning', () => {
      const ctx = new ParserContext(eofOnly());
      const span = {
        start: { offset: 0, line: 1, column: 1 },
        end: { offset: 3, line: 1, column: 4 },
      };

      ctx.warning('PAR100', 'test warning', span);

      expect(ctx.diagnostics).toHaveLength(1);
      expect(ctx.diagnostics[0]!.severity).toBe('warning');
    });

    it('múltiples errores se acumulan en orden', () => {
      const ctx = new ParserContext(eofOnly());
      const span = {
        start: { offset: 0, line: 1, column: 1 },
        end: { offset: 1, line: 1, column: 2 },
      };

      ctx.error('PAR001', 'first', span);
      ctx.warning('PAR002', 'second', span);
      ctx.error('PAR003', 'third', span);

      expect(ctx.diagnostics).toHaveLength(3);
      expect(ctx.diagnostics[0]!.code).toBe('PAR001');
      expect(ctx.diagnostics[1]!.code).toBe('PAR002');
      expect(ctx.diagnostics[2]!.code).toBe('PAR003');
    });
  });

  // ─── Suite 6: Helpers de posición ───────────────────────────────

  describe('Helpers de posición', () => {
    it('tokenStart() extrae Position correcta de un Token', () => {
      const token: Token = {
        kind: 'KW_ENTITY',
        text: 'ENTITY',
        offset: 10,
        line: 2,
        column: 5,
      };
      const pos = tokenStart(token);

      expect(pos.offset).toBe(10);
      expect(pos.line).toBe(2);
      expect(pos.column).toBe(5);
    });

    it('tokenEnd() calcula Position del final del token', () => {
      const token: Token = {
        kind: 'KW_ENTITY',
        text: 'ENTITY',
        offset: 10,
        line: 2,
        column: 5,
      };
      const pos = tokenEnd(token);

      expect(pos.offset).toBe(16);
      expect(pos.line).toBe(2);
      expect(pos.column).toBe(11);
    });

    it('spanOfToken() cubre exactamente un token', () => {
      const token: Token = {
        kind: 'IDENT',
        text: 'foo',
        offset: 0,
        line: 1,
        column: 1,
      };
      const span = spanOfToken(token);

      expect(span.start.offset).toBe(0);
      expect(span.start.column).toBe(1);
      expect(span.end.offset).toBe(3);
      expect(span.end.column).toBe(4);
    });

    it('spanFromTokens() cubre desde el inicio del primero hasta el final del último', () => {
      const first: Token = {
        kind: 'KW_ENTITY',
        text: 'ENTITY',
        offset: 0,
        line: 1,
        column: 1,
      };
      const last: Token = {
        kind: 'SYM_SEMICOLON',
        text: ';',
        offset: 10,
        line: 1,
        column: 11,
      };
      const span = spanFromTokens(first, last);

      expect(span.start.offset).toBe(0);
      expect(span.start.column).toBe(1);
      expect(span.end.offset).toBe(11);
      expect(span.end.column).toBe(12);
    });

    it('startPos() retorna la posición del token actual', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY'], ['IDENT', 'foo']);
      const ctx = new ParserContext(tokens);

      const pos = ctx.startPos();
      expect(pos.offset).toBe(tokens[0]!.offset);
      expect(pos.line).toBe(tokens[0]!.line);
      expect(pos.column).toBe(tokens[0]!.column);
    });

    it('spanFrom(start) crea span desde posición hasta el final del último token consumido', () => {
      const tokens = makeTokens(
        ['KW_ENTITY', 'ENTITY'],
        ['IDENT', 'foo'],
        ['SYM_SEMICOLON', ';'],
      );
      const ctx = new ParserContext(tokens);

      const start = ctx.startPos();
      ctx.consume(); // ENTITY
      ctx.consume(); // foo

      const span = ctx.spanFrom(start);
      expect(span.start.offset).toBe(tokens[0]!.offset);
      expect(span.end.offset).toBe(tokens[1]!.offset + tokens[1]!.text.length);
    });

    it('spanFrom(start) sin consumir usa posición del token actual como fallback', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      const start = ctx.startPos();
      const span = ctx.spanFrom(start);

      expect(span.start.offset).toBe(tokens[0]!.offset);
      expect(span.end.offset).toBe(tokens[0]!.offset);
    });
  });

  // ─── Suite 7: Filtrado de trivia (preparación futura) ───────────

  describe('Filtrado de trivia (preparación futura)', () => {
    it('con el lexer actual (sin trivia), todos los tokens se procesan normalmente', () => {
      const tokens = makeTokens(
        ['KW_ENTITY', 'ENTITY'],
        ['IDENT', 'foo'],
        ['SYM_SEMICOLON', ';'],
        ['KW_END_ENTITY', 'END_ENTITY'],
        ['SYM_SEMICOLON', ';'],
      );
      const ctx = new ParserContext(tokens);

      const consumed: TokenKind[] = [];
      while (!ctx.isEOF()) {
        consumed.push(ctx.consume().kind);
      }

      expect(consumed).toEqual([
        'KW_ENTITY',
        'IDENT',
        'SYM_SEMICOLON',
        'KW_END_ENTITY',
        'SYM_SEMICOLON',
      ]);
    });
  });
});
