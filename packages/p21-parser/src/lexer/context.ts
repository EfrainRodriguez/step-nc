import type { P21LexDiagnostic, P21Token, P21TokenKind } from './types';

export class LexerContext {
  readonly source: string;
  index = 0;
  line = 1;
  column = 1;
  readonly tokens: P21Token[] = [];
  readonly diagnostics: P21LexDiagnostic[] = [];

  constructor(source: string) {
    this.source = source;
  }

  eof(): boolean {
    return this.index >= this.source.length;
  }

  peek(offset = 0): string {
    return this.source.charAt(this.index + offset);
  }

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

  startsWith(text: string): boolean {
    return this.source.startsWith(text, this.index);
  }

  slice(start: number, end: number): string {
    return this.source.slice(start, end);
  }

  emit(
    kind: P21TokenKind,
    text: string,
    offset: number,
    line: number,
    col: number,
  ): void {
    this.tokens.push({ kind, text, offset, line, column: col });
  }

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

  warning(code: string, message: string): void {
    this.diagnostics.push({
      code,
      message,
      offset: this.index,
      line: this.line,
      column: this.column,
      severity: 'warning',
    });
  }
}
