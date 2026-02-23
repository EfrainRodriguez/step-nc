import type { Position, Span } from '../ast/base';
import type { Token, TokenKind } from '../lexer/types';
import type { ParseDiagnostic } from './types';
import { spanBetween, spanOfToken, tokenEnd, tokenStart } from './types';

/**
 * Mutable parser context that wraps a Token[] and provides navigation,
 * lookahead, and diagnostic accumulation for a recursive descent parser.
 *
 * Modelled after LexerContext: constructor receives the input,
 * mutable internal position, readonly diagnostic accumulator.
 */
export class ParserContext {
  private readonly tokens: Token[];
  private pos = 0;
  private previous: Token | undefined;

  readonly diagnostics: ParseDiagnostic[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  // ── Navigation ────────────────────────────────────────────────

  /**
   * Returns the token at the current position + offset, without consuming it.
   * Skips trivia automatically forward.
   * If it passes the end, returns the EOF token (last in the array).
   */
  peek(offset = 0): Token {
    let idx = this.pos;
    let remaining = offset;

    while (remaining > 0 && idx < this.tokens.length - 1) {
      idx++;
      if (!this.isTrivia(this.tokens[idx]!)) {
        remaining--;
      }
    }

    if (idx >= this.tokens.length) {
      return this.eofToken();
    }

    return this.tokens[idx]!;
  }

  /**
   * Consume the current token and advance to the next (skipping trivia).
   * Returns the consumed token. If already at EOF, returns EOF without advancing.
   */
  consume(): Token {
    const token = this.tokens[this.pos]!;

    if (token.kind !== 'EOF') {
      this.previous = token;
      this.pos++;
      this.skipTrivia();
    }

    return token;
  }

  /**
   * Checks if the current token is of the given kind. Does not consume the token.
   */
  check(kind: TokenKind): boolean {
    return this.peek().kind === kind;
  }

  /**
   * If the current token is of the given kind, consume it and return true.
   * If not, return false without consuming.
   */
  skip(kind: TokenKind): boolean {
    if (this.check(kind)) {
      this.consume();
      return true;
    }
    return false;
  }

  /**
   * If the current token is of the given kind, consume it and return it.
   * If not, register an error diagnostic and return the current token
   * without consuming it (to allow recovery in the caller).
   */
  expect(kind: TokenKind): Token {
    const token = this.peek();
    if (token.kind === kind) {
      return this.consume();
    }

    this.diagnostics.push({
      code: 'PAR001',
      message: `Expected '${kind}' but found '${token.kind}'`,
      span: spanOfToken(token),
      severity: 'error',
    });

    return token;
  }

  // ── State ────────────────────────────────────────────────────

  /** True if the current token is EOF. */
  isEOF(): boolean {
    return this.peek().kind === 'EOF';
  }

  /** Returns the current token without consuming (alias of peek(0)). */
  current(): Token {
    return this.peek();
  }

  // ── Diagnostics ──────────────────────────────────────────────

  /** Register a parsing error with span. */
  error(code: string, message: string, span: Span): void {
    this.diagnostics.push({ code, message, span, severity: 'error' });
  }

  /** Register a parsing warning with span. */
  warning(code: string, message: string, span: Span): void {
    this.diagnostics.push({ code, message, span, severity: 'warning' });
  }

  // ── Position Helpers ───────────────────────────────────────

  /** Extract the Position from the beginning of the current token. */
  startPos(): Position {
    return tokenStart(this.peek());
  }

  /**
   * Create a Span from a start position to the end position
   * of the last consumed token. If no token has been consumed,
   * use the position of the current token as fallback.
   */
  spanFrom(start: Position): Span {
    const end = this.previous
      ? tokenEnd(this.previous)
      : tokenStart(this.peek());
    return spanBetween(start, end);
  }

  // ── Internals ─────────────────────────────────────────────────

  /**
   * Determines if a token is trivia (whitespace, comments).
   * The current lexer does not emit trivia, so always returns false.
   * When the lexer emits trivia tokens, only the isTrivia method needs to be updated.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private isTrivia(_token: Token): boolean {
    return false;
  }

  /** Advance pos skipping trivia tokens. */
  private skipTrivia(): void {
    while (
      this.pos < this.tokens.length &&
      this.isTrivia(this.tokens[this.pos]!)
    ) {
      this.pos++;
    }
  }

  /** Returns the EOF token (always the last in the array). */
  private eofToken(): Token {
    return this.tokens[this.tokens.length - 1]!;
  }
}
