import { describe, expect, it } from 'vitest';
import type { Token, TokenKind } from '../../src/lexer/types';
import { ParserContext } from '../../src/parser/context';
import {
  spanFromTokens,
  spanOfToken,
  tokenEnd,
  tokenStart,
} from '../../src/parser/types';

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
  // ─── Suite 1: Basic navigation ─────────────────────────────────

  describe('Basic navigation', () => {
    it('peek() returns the first token without consuming it', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY'], ['IDENT', 'foo']);
      const ctx = new ParserContext(tokens);

      expect(ctx.peek().kind).toBe('KW_ENTITY');
      expect(ctx.peek().kind).toBe('KW_ENTITY');
    });

    it('peek() returns EOF for empty array (only EOF)', () => {
      const ctx = new ParserContext(eofOnly());
      expect(ctx.peek().kind).toBe('EOF');
    });

    it('peek(1) returns the second token (lookahead)', () => {
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

    it('peek(offset) out of range returns EOF', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      expect(ctx.peek(99).kind).toBe('EOF');
    });

    it('consume() returns current token and advances', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY'], ['IDENT', 'foo']);
      const ctx = new ParserContext(tokens);

      const consumed = ctx.consume();
      expect(consumed.kind).toBe('KW_ENTITY');
      expect(ctx.peek().kind).toBe('IDENT');
    });

    it('multiple consume() calls advance sequentially', () => {
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
    it('check(kind) returns true on match without consuming', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      expect(ctx.check('KW_ENTITY')).toBe(true);
      expect(ctx.peek().kind).toBe('KW_ENTITY');
    });

    it('check(kind) returns false when not matching', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      expect(ctx.check('KW_TYPE')).toBe(false);
    });

    it('skip(kind) returns true and consumes on match', () => {
      const tokens = makeTokens(
        ['SYM_SEMICOLON', ';'],
        ['KW_ENTITY', 'ENTITY'],
      );
      const ctx = new ParserContext(tokens);

      expect(ctx.skip('SYM_SEMICOLON')).toBe(true);
      expect(ctx.peek().kind).toBe('KW_ENTITY');
    });

    it('skip(kind) returns false and does not consume on mismatch', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      expect(ctx.skip('SYM_SEMICOLON')).toBe(false);
      expect(ctx.peek().kind).toBe('KW_ENTITY');
    });
  });

  // ─── Suite 3: expect ────────────────────────────────────────────

  describe('expect', () => {
    it('expect(kind) consumes and returns token on match', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY'], ['IDENT', 'foo']);
      const ctx = new ParserContext(tokens);

      const token = ctx.expect('KW_ENTITY');
      expect(token.kind).toBe('KW_ENTITY');
      expect(ctx.peek().kind).toBe('IDENT');
    });

    it('expect(kind) records diagnostic if token does not match', () => {
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

    it('expect diagnostic has correct code, message, and span', () => {
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
    it('isEOF() returns false at start when tokens exist', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      expect(ctx.isEOF()).toBe(false);
    });

    it('isEOF() returns true when EOF is reached', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      ctx.consume();
      expect(ctx.isEOF()).toBe(true);
    });

    it('consume() at EOF returns EOF token without advancing further', () => {
      const ctx = new ParserContext(eofOnly());

      const t1 = ctx.consume();
      const t2 = ctx.consume();
      expect(t1.kind).toBe('EOF');
      expect(t2.kind).toBe('EOF');
      expect(t1).toBe(t2);
    });

    it('peek() at EOF always returns EOF', () => {
      const ctx = new ParserContext(eofOnly());

      expect(ctx.peek().kind).toBe('EOF');
      expect(ctx.peek(0).kind).toBe('EOF');
      expect(ctx.peek(5).kind).toBe('EOF');
    });
  });

  // ─── Suite 5: Diagnostics ──────────────────────────────────────

  describe('Diagnostics', () => {
    it('error() accumulates in diagnostics with error severity', () => {
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

    it('warning() accumulates with warning severity', () => {
      const ctx = new ParserContext(eofOnly());
      const span = {
        start: { offset: 0, line: 1, column: 1 },
        end: { offset: 3, line: 1, column: 4 },
      };

      ctx.warning('PAR100', 'test warning', span);

      expect(ctx.diagnostics).toHaveLength(1);
      expect(ctx.diagnostics[0]!.severity).toBe('warning');
    });

    it('multiple errors accumulate in order', () => {
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

  // ─── Suite 6: Position helpers ───────────────────────────────

  describe('Position helpers', () => {
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

    it('spanFromTokens() covers from first start to last end', () => {
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

    it('startPos() returns the current token position', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY'], ['IDENT', 'foo']);
      const ctx = new ParserContext(tokens);

      const pos = ctx.startPos();
      expect(pos.offset).toBe(tokens[0]!.offset);
      expect(pos.line).toBe(tokens[0]!.line);
      expect(pos.column).toBe(tokens[0]!.column);
    });

    it('spanFrom(start) builds span from start to end of last consumed token', () => {
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

    it('spanFrom(start) without consume uses current token position as fallback', () => {
      const tokens = makeTokens(['KW_ENTITY', 'ENTITY']);
      const ctx = new ParserContext(tokens);

      const start = ctx.startPos();
      const span = ctx.spanFrom(start);

      expect(span.start.offset).toBe(tokens[0]!.offset);
      expect(span.end.offset).toBe(tokens[0]!.offset);
    });
  });

  // ─── Suite 7: Trivia filtering (future prep) ───────────

  describe('Trivia filtering (future prep)', () => {
    it('with current lexer (no trivia), all tokens are processed normally', () => {
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
