/**
 * TokenCategory describes the high-level classification of lexical elements
 * found in EXPRESS (ISO 10303-11).
 *
 * - 'keyword': Standard language keywords such as ENTITY, TYPE, END_SCHEMA, etc.
 * - 'operator_keyword': Keywords used as boolean or relational operators (AND, OR, DIV…).
 * - 'builtin_constant_keyword': Built-in constants (? , TRUE, FALSE, SELF…).
 * - 'builtin_function_keyword': Built-in functions such as ABS, TYPEOF, SIZEOF, etc.
 * - 'builtin_procedure_keyword': Built-in procedures (INSERT, REMOVE).
 * - 'symbol': Punctuation or symbolic operators (:=, <>, (*, *), [, ], ...).
 * - 'trivia': Whitespace or comments (typically ignored by the parser layer).
 */
export type TokenCategory =
  | 'keyword'
  | 'operator_keyword'
  | 'builtin_constant_keyword'
  | 'builtin_function_keyword'
  | 'builtin_procedure_keyword'
  | 'symbol'
  | 'trivia';

/**
 * BaseToken represents a static token specification:
 * a known lexeme (text) in the language and its classification.
 * This is used for building lookup tables and matching keywords/symbols.
 */
export interface BaseToken {
  /** Unique, descriptive token name (e.g., KW_ENTITY, SYM_ASSIGN) */
  name: string;

  /** Category of the token (keyword, symbol, builtin...) */
  category: TokenCategory;

  /** Actual lexeme as it appears in EXPRESS source code */
  lexeme: string;

  /** Optional human-readable explanation */
  description?: string;
}

/**
 * TokenKind enumerates all possible token identifiers produced by the lexer.
 * It includes:
 * - all BaseToken names (e.g., KW_ENTITY, OP_AND, SYM_ASSIGN)
 * - literal kinds (strings, numbers, binary)
 * - identifiers
 * - end-of-file marker
 */
export type TokenKind =
  | BaseToken['name']
  | 'LIT_INTEGER'
  | 'LIT_REAL'
  | 'LIT_STRING'
  | 'LIT_BINARY'
  | 'IDENT'
  | 'EOF';

/**
 * Token is the runtime representation of a piece of source code
 * identified by the lexer.
 *
 * - kind:       the token type
 * - text:       the exact substring from the source
 * - offset:     absolute position in the source string
 * - line/column: 1-based tracking for diagnostics and error reporting
 */
export interface Token {
  kind: TokenKind;
  text: string;
  offset: number;
  line: number;
  column: number;
}

/**
 * LexDiagnostic represents a lexer error or warning emitted during scanning.
 *
 * - code:       short machine-readable identifier (e.g., LEX001)
 * - message:    human-readable explanation
 * - offset:     position in the source
 * - line/column: text location for user-friendly reporting
 * - severity:   whether the issue is an 'error' or 'warning'
 */
export interface LexDiagnostic {
  code: string;
  message: string;
  offset: number;
  line: number;
  column: number;
  severity: 'error' | 'warning';
}
