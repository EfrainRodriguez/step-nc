import { LexerContext } from './context';
import type { Token, LexDiagnostic } from './types';

import {
  scanWhitespace,
  scanLineComment,
  scanBlockComment,
  scanQuestionBuiltin,
  scanNumberLiteral,
  scanStringLiteral,
  scanIdentifierOrKeyword,
  scanBinaryLiteral,
  scanSymbol,
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

export function lexExpress(source: string): LexResult {
  const ctx = new LexerContext(source);

  while (!ctx.eof()) {
    let matched = false;

    for (const scan of HANDLERS) {
      if (scan(ctx)) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      const ch = ctx.peek();
      ctx.error('LEX001', `Unexpected character '${ch}'`);
      ctx.advance();
    }
  }

  ctx.emit('EOF', '', ctx.index, ctx.line, ctx.column);

  return {
    tokens: ctx.tokens,
    diagnostics: ctx.diagnostics,
  };
}
