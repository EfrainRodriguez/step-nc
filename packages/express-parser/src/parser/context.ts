import type { Position, Span } from '../ast/base';
import type { TokenStream } from '../lexer/token-stream';
import type { Token, TokenKind } from '../lexer/types';
import type { ParseDiagnostic, ParseOptions } from './types';
import {
  DEFAULT_MAX_ENTITY_SECTION_ITEMS,
  DEFAULT_MAX_EXPLICIT_ATTRIBUTES,
  spanBetween,
  spanOfToken,
  tokenEnd,
  tokenStart,
} from './types';

/**
 * Mutable parser context that wraps a Token[] or TokenStream and provides
 * navigation, lookahead, and diagnostic accumulation for a recursive descent
 * parser.
 *
 * When initialized with a TokenStream, uses a sliding-window buffer that
 * grows on demand and periodically releases consumed tokens for GC.
 */
export class ParserContext {
  private readonly buffer: Token[];
  private pos = 0;
  private previous: Token | undefined;
  private readonly options: ParseOptions | undefined;

  private readonly stream: TokenStream | null;
  private streamExhausted = false;

  /** Monotonically increasing counter for progress detection (not reset by compact). */
  private consumeCount = 0;

  private readonly COMPACT_THRESHOLD = 4096;

  readonly diagnostics: ParseDiagnostic[] = [];

  constructor(tokens: Token[], options?: ParseOptions);
  constructor(stream: TokenStream, options?: ParseOptions);
  constructor(source: Token[] | TokenStream, options?: ParseOptions) {
    if (Array.isArray(source)) {
      this.buffer = source;
      this.stream = null;
      this.streamExhausted = true;
    } else {
      this.buffer = [];
      this.stream = source;
    }
    this.options = options;
  }

  // ── Navigation ────────────────────────────────────────────────

  /**
   * Returns the token at the current position + offset, without consuming it.
   * Skips trivia automatically forward.
   * If it passes the end, returns the EOF token.
   */
  peek(offset = 0): Token {
    let idx = this.pos;
    let remaining = offset;

    while (remaining > 0) {
      idx++;
      this.ensureBuffered(idx);
      if (idx >= this.buffer.length) return this.eofToken();
      if (!this.isTrivia(this.buffer[idx]!)) {
        remaining--;
      }
    }

    this.ensureBuffered(idx);
    if (idx >= this.buffer.length) {
      return this.eofToken();
    }

    return this.buffer[idx]!;
  }

  /**
   * Consume the current token and advance to the next (skipping trivia).
   * Returns the consumed token. If already at EOF, returns EOF without advancing.
   */
  consume(): Token {
    this.ensureBuffered(this.pos);
    const token = this.buffer[this.pos]!;

    if (token.kind !== 'EOF') {
      this.previous = token;
      this.pos++;
      this.consumeCount++;
      this.skipTrivia();
    }

    if (this.stream && this.pos > this.COMPACT_THRESHOLD) {
      this.compact();
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

  /**
   * Monotonic progress counter for loop detection / error recovery.
   * Unlike `pos`, this value never resets after buffer compaction.
   */
  position(): number {
    return this.consumeCount;
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

  /** Effective max explicit attributes for entity parsing. */
  getMaxExplicitAttributes(): number {
    return (
      this.options?.maxExplicitAttributes ?? DEFAULT_MAX_EXPLICIT_ATTRIBUTES
    );
  }

  /** Effective max DERIVE/INVERSE section items per entity. */
  getMaxEntitySectionItems(): number {
    return (
      this.options?.maxEntitySectionItems ?? DEFAULT_MAX_ENTITY_SECTION_ITEMS
    );
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
    this.ensureBuffered(this.pos);
    while (
      this.pos < this.buffer.length &&
      this.isTrivia(this.buffer[this.pos]!)
    ) {
      this.pos++;
      this.ensureBuffered(this.pos);
    }
  }

  /** Returns the EOF token. */
  private eofToken(): Token {
    if (this.streamExhausted && this.buffer.length > 0) {
      return this.buffer[this.buffer.length - 1]!;
    }
    // Pull tokens until EOF is found
    this.ensureBuffered(this.buffer.length);
    while (!this.streamExhausted) {
      this.ensureBuffered(this.buffer.length);
    }
    return this.buffer[this.buffer.length - 1]!;
  }

  /** Fill the buffer from the stream until it has at least idx+1 elements. */
  private ensureBuffered(idx: number): void {
    if (this.streamExhausted) return;
    while (this.buffer.length <= idx) {
      const token = this.stream!.next();
      this.buffer.push(token);
      if (token.kind === 'EOF') {
        this.streamExhausted = true;
        break;
      }
    }
  }

  /** Release consumed tokens from the front of the buffer to free memory. */
  private compact(): void {
    this.buffer.splice(0, this.pos);
    this.pos = 0;
  }
}
