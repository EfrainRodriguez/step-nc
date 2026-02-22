import { LexerContext } from './context';
import {
  isWhitespace,
  isDigit,
  isIdentifierStart,
  isIdentifierPart,
  isBinaryDigit,
} from './helpers';
import type { BaseToken, TokenKind } from './types';
import { KEYWORD_MAP, SYMBOLS_SORTED } from './tables';
import { BUILTIN_CONSTANT_TOKENS } from './tokens';

/* ──────────────────────────────────────────────────────────────── */
/*  Whitespace                                                      */
/* ──────────────────────────────────────────────────────────────── */

export function scanWhitespace(ctx: LexerContext): boolean {
  if (!isWhitespace(ctx.peek())) return false;
  ctx.advance();
  return true;
}

/* ──────────────────────────────────────────────────────────────── */
/*  Line comment `--`                                               */
/* ──────────────────────────────────────────────────────────────── */

export function scanLineComment(ctx: LexerContext): boolean {
  if (!ctx.startsWith('--')) return false;
  ctx.advance(2);
  while (!ctx.eof() && ctx.peek() !== '\n') {
    ctx.advance();
  }
  return true;
}

/* ──────────────────────────────────────────────────────────────── */
/*  Block comment  (* ... *)                                       */
/* ──────────────────────────────────────────────────────────────── */

export function scanBlockComment(ctx: LexerContext): boolean {
  if (!ctx.startsWith('(*')) return false;

  ctx.advance(2); // consume "(*"

  while (!ctx.eof()) {
    if (ctx.startsWith('*)')) {
      ctx.advance(2);
      return true;
    }
    ctx.advance();
  }

  ctx.error('LEX003', 'Unterminated block comment. Expected closing `*)`.');
  return true;
}

/* ──────────────────────────────────────────────────────────────── */
/*  Number literal (integer + real)                                */
/* ──────────────────────────────────────────────────────────────── */

export function scanNumberLiteral(ctx: LexerContext): boolean {
  if (!isDigit(ctx.peek())) return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  let text = '';

  while (!ctx.eof() && isDigit(ctx.peek())) text += ctx.advance();

  let kind: TokenKind = 'LIT_INTEGER';

  if (ctx.peek() === '.') {
    text += ctx.advance();
    while (!ctx.eof() && isDigit(ctx.peek())) text += ctx.advance();
    kind = 'LIT_REAL';
  }

  ctx.emit(kind, text, start, line, col);
  return true;
}

/* ──────────────────────────────────────────────────────────────── */
/*  String literal `'...'`                                         */
/* ──────────────────────────────────────────────────────────────── */

export function scanStringLiteral(ctx: LexerContext): boolean {
  if (ctx.peek() !== "'") return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  let text = '';
  text += ctx.advance(); // opening quote

  while (!ctx.eof()) {
    const c = ctx.advance();
    text += c;
    if (c === "'") {
      ctx.emit('LIT_STRING', text, start, line, col);
      return true;
    }
  }

  ctx.error('LEX002', 'Unterminated string literal. Expected closing quote.');
  ctx.emit('LIT_STRING', text, start, line, col);
  return true;
}

/* ──────────────────────────────────────────────────────────────── */
/*  Built-in constant '?'                                          */
/* ──────────────────────────────────────────────────────────────── */

const QUESTION_MARK_TOKEN: BaseToken | undefined = BUILTIN_CONSTANT_TOKENS.find(
  (t) => t.lexeme === '?',
);

export function scanQuestionBuiltin(ctx: LexerContext): boolean {
  if (!QUESTION_MARK_TOKEN) return false;
  if (ctx.peek() !== '?') return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  ctx.advance();
  ctx.emit(QUESTION_MARK_TOKEN.name as TokenKind, '?', start, line, col);
  return true;
}

/* ──────────────────────────────────────────────────────────────── */
/*  Binary literal `%[01]+`                                        */
/* ──────────────────────────────────────────────────────────────── */

export function scanBinaryLiteral(ctx: LexerContext): boolean {
  if (ctx.peek() !== '%') return false;
  if (!isBinaryDigit(ctx.peek(1))) return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  let text = ctx.advance(); // consume '%'

  while (!ctx.eof() && isBinaryDigit(ctx.peek())) {
    text += ctx.advance();
  }

  ctx.emit('LIT_BINARY', text, start, line, col);
  return true;
}

/* ──────────────────────────────────────────────────────────────── */
/*  Symbols (sorted longest-first)                                 */
/* ──────────────────────────────────────────────────────────────── */

export function scanSymbol(ctx: LexerContext): boolean {
  for (const spec of SYMBOLS_SORTED) {
    if (ctx.startsWith(spec.lexeme)) {
      const start = ctx.index;
      const line = ctx.line;
      const col = ctx.column;

      ctx.advance(spec.lexeme.length);
      ctx.emit(spec.name as TokenKind, spec.lexeme, start, line, col);
      return true;
    }
  }
  return false;
}

/* ──────────────────────────────────────────────────────────────── */
/*  Identifiers and keywords                                       */
/* ──────────────────────────────────────────────────────────────── */

export function scanIdentifierOrKeyword(ctx: LexerContext): boolean {
  if (!isIdentifierStart(ctx.peek())) return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  let text = '';
  while (!ctx.eof() && isIdentifierPart(ctx.peek())) {
    text += ctx.advance();
  }

  const upper = text.toUpperCase();
  const keywordSpec = KEYWORD_MAP[upper];

  if (keywordSpec) {
    ctx.emit(keywordSpec.name as TokenKind, text, start, line, col);
  } else {
    ctx.emit('IDENT', text, start, line, col);
  }

  return true;
}
