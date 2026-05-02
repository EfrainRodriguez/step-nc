import { LexerContext } from './context';
import { scanNextTokenStreaming } from './lexer';
import type { LexDiagnostic, Token } from './types';

/**
 * Lazy token stream that produces tokens on demand without
 * accumulating them all in memory. Uses LexerContext in streaming
 * mode so emit() stores a single pending token instead of pushing
 * to the tokens array.
 */
export class TokenStream {
  private readonly ctx: LexerContext;
  private _done = false;
  private _eofToken: Token | null = null;

  constructor(source: string) {
    this.ctx = new LexerContext(source);
    this.ctx.enableStreaming();
  }

  /** Returns the next token, or EOF when done. Never returns null. */
  next(): Token {
    if (this._done) return this._eofToken!;

    while (!this.ctx.eof()) {
      const token = scanNextTokenStreaming(this.ctx);
      if (token) return token;
    }

    this._done = true;
    this._eofToken = {
      kind: 'EOF',
      text: '',
      offset: this.ctx.index,
      line: this.ctx.line,
      column: this.ctx.column,
    };
    return this._eofToken;
  }

  get diagnostics(): readonly LexDiagnostic[] {
    return this.ctx.diagnostics;
  }
}

/** Factory function to create a TokenStream. */
export function createTokenStream(source: string): TokenStream {
  return new TokenStream(source);
}
