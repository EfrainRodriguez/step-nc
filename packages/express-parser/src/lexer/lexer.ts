import { LexerContext } from './context';
import type { LexDiagnostic, Token } from './types';

import {
  scanBinaryLiteral,
  scanBlockComment,
  scanIdentifierOrKeyword,
  scanLineComment,
  scanNumberLiteral,
  scanQuestionBuiltin,
  scanStringLiteral,
  scanSymbol,
  scanWhitespace,
} from './scanner';

export interface LexResult {
  tokens: Token[];
  diagnostics: LexDiagnostic[];
}

type HandlerFn = (ctx: LexerContext) => boolean;

const HANDLERS: HandlerFn[] = [
  scanWhitespace,
  scanLineComment,
  scanBlockComment,
  scanQuestionBuiltin,
  scanNumberLiteral,
  scanStringLiteral,
  scanIdentifierOrKeyword,
  scanBinaryLiteral,
  scanSymbol,
];

/**
 * Scans the next token from source. Returns the token, or null if only
 * trivia (whitespace/comments) was consumed. Returns undefined at EOF.
 */
export function scanNextToken(ctx: LexerContext): Token | null | undefined {
  if (ctx.eof()) return undefined;

  const prevLen = ctx.tokens.length;
  let matched = false;

  for (const scan of HANDLERS) {
    if (scan(ctx)) {
      matched = true;
      break;
    }
  }

  if (!matched) {
    ctx.error('LEX001', `Unexpected character '${ctx.peek()}'`);
    ctx.advance();
    return null;
  }

  if (ctx.tokens.length > prevLen) {
    return ctx.tokens[ctx.tokens.length - 1]!;
  }

  return null;
}

/**
 * Scans the next token in streaming mode. Returns the token directly
 * without accumulating it in ctx.tokens. Returns null if only trivia
 * was consumed, or undefined at EOF.
 */
export function scanNextTokenStreaming(
  ctx: LexerContext,
): Token | null | undefined {
  if (ctx.eof()) return undefined;

  let matched = false;

  for (const scan of HANDLERS) {
    if (scan(ctx)) {
      matched = true;
      break;
    }
  }

  if (!matched) {
    ctx.error('LEX001', `Unexpected character '${ctx.peek()}'`);
    ctx.advance();
    return null;
  }

  return ctx.takePendingToken();
}

export function lexExpress(source: string): LexResult {
  const ctx = new LexerContext(source);

  while (!ctx.eof()) {
    scanNextToken(ctx);
  }

  ctx.emit('EOF', '', ctx.index, ctx.line, ctx.column);

  return {
    tokens: ctx.tokens,
    diagnostics: ctx.diagnostics,
  };
}
