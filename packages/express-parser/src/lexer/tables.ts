/**
 * This module builds derived lookup tables from the static token specifications
 * declared in `tokens.ts`. These tables are used by the lexer for fast keyword
 * and symbol recognition.
 */

import type { BaseToken } from './types';
import {
  KEYWORD_TOKENS,
  OPERATOR_KEYWORD_TOKENS,
  BUILTIN_CONSTANT_TOKENS,
  BUILTIN_FUNCTION_TOKENS,
  BUILTIN_PROCEDURE_TOKENS,
  SYMBOL_TOKENS,
} from './tokens';

/**
 * All reserved words (in the broad sense) that should be recognized as
 * something more specific than a plain identifier:
 *
 * - language keywords (ENTITY, TYPE, END_SCHEMA, ...)
 * - operator keywords (AND, OR, DIV, ...)
 * - built-in constants (?, SELF, TRUE, UNKNOWN, ...)
 * - built-in functions (ABS, SIZEOF, TYPEOF, ...)
 * - built-in procedures (INSERT, REMOVE)
 *
 * This combined list is only used to build lookup tables; the lexer itself
 * uses KEYWORD_MAP for O(1) keyword detection.
 */
export const ALL_KEYWORD_TOKENS: BaseToken[] = [
  ...KEYWORD_TOKENS,
  ...OPERATOR_KEYWORD_TOKENS,
  ...BUILTIN_CONSTANT_TOKENS,
  ...BUILTIN_FUNCTION_TOKENS,
  ...BUILTIN_PROCEDURE_TOKENS,
];

/**
 * Lookup table from UPPERCASE lexeme → BaseToken specification.
 *
 * The lexer uses this map to decide whether a scanned identifier text
 * corresponds to:
 * - a language keyword
 * - an operator keyword
 * - a built-in constant/function/procedure
 *
 * EXPRESS is case-insensitive for keywords, so we normalize keys by calling
 * `toUpperCase()` on the lexeme.
 */
const keywordMap: Record<string, BaseToken> = Object.create(null);

for (const spec of ALL_KEYWORD_TOKENS) {
  keywordMap[spec.lexeme.toUpperCase()] = spec;
}

/**
 * Public, read-only view of the keyword map.
 * (Immutability is by convention; callers should treat this as readonly.)
 */
export const KEYWORD_MAP: Record<string, BaseToken> = keywordMap;

/**
 * Symbols sorted by lexeme length in descending order.
 *
 * When scanning symbols in the lexer, we try to match the longest lexeme first
 * (e.g., ':=:' before ':=', '<=' before '<'). This prevents ambiguous matches
 * where a shorter symbol would otherwise “steal” characters from a longer one.
 */
export const SYMBOLS_SORTED: BaseToken[] = [...SYMBOL_TOKENS].sort(
  (a, b) => b.lexeme.length - a.lexeme.length,
);
