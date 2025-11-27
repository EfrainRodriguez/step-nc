import type { Token, TokenKind, LexDiagnostic } from './types';

/**
 * Mutable lexer context that tracks the current position within the EXPRESS
 * source text and accumulates the resulting tokens and diagnostics.
 */
export class LexerContext {
  /** Full EXPRESS source text being tokenized */
  readonly source: string;

  /** Zero-based index into `source` */
  index = 0;

  /** One-based current line number (for diagnostics) */
  line = 1;

  /** One-based current column number (for diagnostics) */
  column = 1;

  /** Collected tokens produced by the lexer */
  readonly tokens: Token[] = [];

  /** Collected diagnostics (errors/warnings) produced during lexing */
  readonly diagnostics: LexDiagnostic[] = [];

  constructor(source: string) {
    this.source = source;
  }

  /** Returns true when the current index is at or past the end of the source. */
  eof(): boolean {
    return this.index >= this.source.length;
  }

  /**
   * Returns the character at the current index plus an optional offset.
   * If the computed position is out of bounds, returns an empty string.
   */
  peek(offset = 0): string {
    return this.source.charAt(this.index + offset);
  }

  /**
   * Advances the current position by up to `n` characters and returns the
   * last character read, or an empty string if nothing was consumed.
   *
   * Line/column counters are updated accordingly.
   */
  advance(n = 1): string {
    let lastChar = '';

    while (n-- > 0 && !this.eof()) {
      const ch = this.source.charAt(this.index++);
      lastChar = ch;

      if (ch === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
    }

    return lastChar;
  }

  /**
   * Checks whether the source at the current index starts with the given text.
   */
  startsWith(text: string): boolean {
    return this.source.startsWith(text, this.index);
  }

  /**
   * Emits a new token with the provided kind and text at the given location.
   */
  emit(
    kind: TokenKind,
    text: string,
    offset: number,
    line: number,
    col: number,
  ): void {
    this.tokens.push({
      kind,
      text,
      offset,
      line,
      column: col,
    });
  }

  /**
   * Records a lexer diagnostic at the current position.
   * For now, `code` is a free string (e.g., "LEX001").
   */
  error(code: string, message: string): void {
    this.diagnostics.push({
      code,
      message,
      offset: this.index,
      line: this.line,
      column: this.column,
      severity: 'error',
    });
  }
}
