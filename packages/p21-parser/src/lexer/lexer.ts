import { LexerContext } from './context';
import {
  scanAngleDelimited,
  scanBinary,
  scanComment,
  scanEntityOrConstantRef,
  scanEnumeration,
  scanIsoDelimiter,
  scanKeyword,
  scanNumber,
  scanString,
  scanSymbol,
  scanTagName,
  scanUserDefinedKeyword,
  scanValueOrConstantRef,
  scanWhitespace,
} from './scanner';
import type { P21LexDiagnostic, P21Token } from './types';

export interface LexResult {
  tokens: P21Token[];
  diagnostics: P21LexDiagnostic[];
}

type HandlerFn = (ctx: LexerContext) => boolean;

const HANDLERS: HandlerFn[] = [
  scanWhitespace,
  scanComment,
  scanIsoDelimiter,
  scanString,
  scanBinary,
  scanEnumeration,
  scanEntityOrConstantRef,
  scanValueOrConstantRef,
  scanAngleDelimited,
  scanNumber,
  scanUserDefinedKeyword,
  scanKeyword,
  scanTagName,
  scanSymbol,
];

export function lexP21(source: string): LexResult {
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
      ctx.error('P21L000', `Unexpected character '${ch}'`);
      ctx.advance();
    }
  }

  ctx.emit('EOF', '', ctx.index, ctx.line, ctx.column);

  return {
    tokens: ctx.tokens,
    diagnostics: ctx.diagnostics,
  };
}
