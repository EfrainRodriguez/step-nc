import type { Position, Span } from '../ast/base';
import type { Token } from '../lexer/types';

// ── Types of diagnosis ────────────────────────────────────────

export type DiagnosticSeverity = 'error' | 'warning';

export interface ParseDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly span: Span;
  readonly severity: DiagnosticSeverity;
}

// ── Position Token Helpers → AST ─────────────────────────────

/** Extract a Position from the beginning of a Token. */
export function tokenStart(token: Token): Position {
  return {
    offset: token.offset,
    line: token.line,
    column: token.column,
  };
}

/**
 * Extracts a Position from the end of a Token (offset + text.length).
 * Assumes the token does not contain line breaks (reasonable for the
 * vast majority of Express tokens; multiline strings are the only rare
 * case).
 */
export function tokenEnd(token: Token): Position {
  return {
    offset: token.offset + token.text.length,
    line: token.line,
    column: token.column + token.text.length,
  };
}

/** Create a Span between two Positions. */
export function spanBetween(start: Position, end: Position): Span {
  return { start, end };
}

/** Create a Span that covers a single token. */
export function spanOfToken(token: Token): Span {
  return spanBetween(tokenStart(token), tokenEnd(token));
}

/** Create a Span from a start token to a end token. */
export function spanFromTokens(from: Token, to: Token): Span {
  return spanBetween(tokenStart(from), tokenEnd(to));
}
