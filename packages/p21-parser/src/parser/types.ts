import type { Position, Span } from '../ast/base';
import type { P21Token } from '../lexer/types';

export type DiagnosticSeverity = 'error' | 'warning';

export interface P21ParseDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly span: Span;
  readonly severity: DiagnosticSeverity;
}

export interface P21ParseOptions {
  /** Maximum number of entities per DATA section (safety limit). */
  maxEntities?: number;
}

export function tokenStart(token: P21Token): Position {
  return {
    offset: token.offset,
    line: token.line,
    column: token.column,
  };
}

export function tokenEnd(token: P21Token): Position {
  return {
    offset: token.offset + token.text.length,
    line: token.line,
    column: token.column + token.text.length,
  };
}

export function spanBetween(start: Position, end: Position): Span {
  return { start, end };
}

export function spanOfToken(token: P21Token): Span {
  return spanBetween(tokenStart(token), tokenEnd(token));
}

export function spanFromTokens(from: P21Token, to: P21Token): Span {
  return spanBetween(tokenStart(from), tokenEnd(to));
}
