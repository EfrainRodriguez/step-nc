import type { Position, Span } from '../ast/base';
import type { P21Token, P21TokenKind } from '../lexer/types';
import type { P21ParseDiagnostic, P21ParseOptions } from './types';
import { spanBetween, spanOfToken, tokenEnd, tokenStart } from './types';

export class ParserContext {
  private readonly tokens: P21Token[];
  private pos = 0;
  private previous: P21Token | undefined;
  private readonly options: P21ParseOptions | undefined;

  readonly diagnostics: P21ParseDiagnostic[] = [];

  constructor(tokens: P21Token[], options?: P21ParseOptions) {
    this.tokens = tokens;
    this.options = options;
  }

  peek(offset = 0): P21Token {
    const idx = this.pos + offset;
    if (idx >= this.tokens.length) {
      return this.eofToken();
    }
    return this.tokens[idx]!;
  }

  consume(): P21Token {
    const token = this.tokens[this.pos]!;
    if (token.kind !== 'EOF') {
      this.previous = token;
      this.pos++;
    }
    return token;
  }

  check(kind: P21TokenKind): boolean {
    return this.peek().kind === kind;
  }

  checkAny(...kinds: P21TokenKind[]): boolean {
    const current = this.peek().kind;
    return kinds.includes(current);
  }

  skip(kind: P21TokenKind): boolean {
    if (this.check(kind)) {
      this.consume();
      return true;
    }
    return false;
  }

  expect(kind: P21TokenKind): P21Token {
    const token = this.peek();
    if (token.kind === kind) {
      return this.consume();
    }
    this.diagnostics.push({
      code: 'P21P001',
      message: `Expected '${kind}' but found '${token.kind}'`,
      span: spanOfToken(token),
      severity: 'error',
    });
    return token;
  }

  isEOF(): boolean {
    return this.peek().kind === 'EOF';
  }

  current(): P21Token {
    return this.peek();
  }

  position(): number {
    return this.pos;
  }

  error(code: string, message: string, span: Span): void {
    this.diagnostics.push({ code, message, span, severity: 'error' });
  }

  warning(code: string, message: string, span: Span): void {
    this.diagnostics.push({ code, message, span, severity: 'warning' });
  }

  startPos(): Position {
    return tokenStart(this.peek());
  }

  spanFrom(start: Position): Span {
    const end = this.previous
      ? tokenEnd(this.previous)
      : tokenStart(this.peek());
    return spanBetween(start, end);
  }

  getMaxEntities(): number {
    return this.options?.maxEntities ?? 1_000_000;
  }

  private eofToken(): P21Token {
    return this.tokens[this.tokens.length - 1]!;
  }
}
