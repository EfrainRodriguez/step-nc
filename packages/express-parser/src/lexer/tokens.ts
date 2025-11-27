/**
 * This file declares the static token specifications used by the lexer.
 * These tokens represent all EXPRESS language keywords, built-in constructs,
 * and symbolic operators. They are not produced directly; instead, the lexer
 * matches them against the source code using their `lexeme`.
 *
 * Notes on naming:
 * - Prefixes (KW_, OP_, SYM_, BF_, BC_, BP_) keep token names short,
 *   predictable, and easy to classify.
 * - Token names act as unique identifiers for TokenKind.
 */

import type { BaseToken } from './types';

/**
 * EXPRESS language keywords (e.g., ENTITY, END_TYPE, SELECT).
 * These represent the core constructs of ISO 10303-11.
 */
export const KEYWORD_TOKENS: BaseToken[] = [
  { name: 'KW_ABSTRACT', category: 'keyword', lexeme: 'ABSTRACT' },
  { name: 'KW_AGGREGATE', category: 'keyword', lexeme: 'AGGREGATE' },
  { name: 'KW_ALIAS', category: 'keyword', lexeme: 'ALIAS' },
  { name: 'KW_ARRAY', category: 'keyword', lexeme: 'ARRAY' },
  { name: 'KW_AS', category: 'keyword', lexeme: 'AS' },
  { name: 'KW_BAG', category: 'keyword', lexeme: 'BAG' },
  { name: 'KW_BASED_ON', category: 'keyword', lexeme: 'BASED_ON' },
  { name: 'KW_BEGIN', category: 'keyword', lexeme: 'BEGIN' },
  { name: 'KW_BINARY', category: 'keyword', lexeme: 'BINARY' },
  { name: 'KW_BOOLEAN', category: 'keyword', lexeme: 'BOOLEAN' },
  { name: 'KW_BY', category: 'keyword', lexeme: 'BY' },
  { name: 'KW_CASE', category: 'keyword', lexeme: 'CASE' },
  { name: 'KW_CONSTANT', category: 'keyword', lexeme: 'CONSTANT' },
  { name: 'KW_DERIVE', category: 'keyword', lexeme: 'DERIVE' },
  { name: 'KW_ELSE', category: 'keyword', lexeme: 'ELSE' },
  { name: 'KW_END', category: 'keyword', lexeme: 'END' },
  { name: 'KW_END_ALIAS', category: 'keyword', lexeme: 'END_ALIAS' },
  { name: 'KW_END_CASE', category: 'keyword', lexeme: 'END_CASE' },
  { name: 'KW_END_CONSTANT', category: 'keyword', lexeme: 'END_CONSTANT' },
  { name: 'KW_END_ENTITY', category: 'keyword', lexeme: 'END_ENTITY' },
  { name: 'KW_END_FUNCTION', category: 'keyword', lexeme: 'END_FUNCTION' },
  { name: 'KW_END_IF', category: 'keyword', lexeme: 'END_IF' },
  { name: 'KW_END_LOCAL', category: 'keyword', lexeme: 'END_LOCAL' },
  { name: 'KW_END_PROCEDURE', category: 'keyword', lexeme: 'END_PROCEDURE' },
  { name: 'KW_END_REPEAT', category: 'keyword', lexeme: 'END_REPEAT' },
  { name: 'KW_END_RULE', category: 'keyword', lexeme: 'END_RULE' },
  { name: 'KW_END_SCHEMA', category: 'keyword', lexeme: 'END_SCHEMA' },
  {
    name: 'KW_END_SUBTYPE_CONSTRAINT',
    category: 'keyword',
    lexeme: 'END_SUBTYPE_CONSTRAINT',
  },
  { name: 'KW_END_TYPE', category: 'keyword', lexeme: 'END_TYPE' },
  { name: 'KW_ENTITY', category: 'keyword', lexeme: 'ENTITY' },
  { name: 'KW_ENUMERATION', category: 'keyword', lexeme: 'ENUMERATION' },
  { name: 'KW_ESCAPE', category: 'keyword', lexeme: 'ESCAPE' },
  { name: 'KW_EXTENSIBLE', category: 'keyword', lexeme: 'EXTENSIBLE' },
  { name: 'KW_FIXED', category: 'keyword', lexeme: 'FIXED' },
  { name: 'KW_FOR', category: 'keyword', lexeme: 'FOR' },
  { name: 'KW_FROM', category: 'keyword', lexeme: 'FROM' },
  { name: 'KW_FUNCTION', category: 'keyword', lexeme: 'FUNCTION' },
  { name: 'KW_GENERIC', category: 'keyword', lexeme: 'GENERIC' },
  {
    name: 'KW_GENERIC_ENTITY',
    category: 'keyword',
    lexeme: 'GENERIC_ENTITY',
  },
  { name: 'KW_IF', category: 'keyword', lexeme: 'IF' },
  { name: 'KW_INTEGER', category: 'keyword', lexeme: 'INTEGER' },
  { name: 'KW_INVERSE', category: 'keyword', lexeme: 'INVERSE' },
  { name: 'KW_LIST', category: 'keyword', lexeme: 'LIST' },
  { name: 'KW_LOCAL', category: 'keyword', lexeme: 'LOCAL' },
  { name: 'KW_LOGICAL', category: 'keyword', lexeme: 'LOGICAL' },
  { name: 'KW_NUMBER', category: 'keyword', lexeme: 'NUMBER' },
  { name: 'KW_OF', category: 'keyword', lexeme: 'OF' },
  { name: 'KW_ONEOF', category: 'keyword', lexeme: 'ONEOF' },
  { name: 'KW_OPTIONAL', category: 'keyword', lexeme: 'OPTIONAL' },
  { name: 'KW_OTHERWISE', category: 'keyword', lexeme: 'OTHERWISE' },
  { name: 'KW_PROCEDURE', category: 'keyword', lexeme: 'PROCEDURE' },
  { name: 'KW_QUERY', category: 'keyword', lexeme: 'QUERY' },
  { name: 'KW_REAL', category: 'keyword', lexeme: 'REAL' },
  { name: 'KW_RENAMED', category: 'keyword', lexeme: 'RENAMED' },
  { name: 'KW_REFERENCE', category: 'keyword', lexeme: 'REFERENCE' },
  { name: 'KW_REPEAT', category: 'keyword', lexeme: 'REPEAT' },
  { name: 'KW_RETURN', category: 'keyword', lexeme: 'RETURN' },
  { name: 'KW_RULE', category: 'keyword', lexeme: 'RULE' },
  { name: 'KW_SCHEMA', category: 'keyword', lexeme: 'SCHEMA' },
  { name: 'KW_SELECT', category: 'keyword', lexeme: 'SELECT' },
  { name: 'KW_SET', category: 'keyword', lexeme: 'SET' },
  { name: 'KW_SKIP', category: 'keyword', lexeme: 'SKIP' },
  { name: 'KW_STRING', category: 'keyword', lexeme: 'STRING' },
  { name: 'KW_SUBTYPE', category: 'keyword', lexeme: 'SUBTYPE' },
  {
    name: 'KW_SUBTYPE_CONSTRAINT',
    category: 'keyword',
    lexeme: 'SUBTYPE_CONSTRAINT',
  },
  { name: 'KW_SUPERTYPE', category: 'keyword', lexeme: 'SUPERTYPE' },
  { name: 'KW_THEN', category: 'keyword', lexeme: 'THEN' },
  { name: 'KW_TO', category: 'keyword', lexeme: 'TO' },
  { name: 'KW_TOTAL_OVER', category: 'keyword', lexeme: 'TOTAL_OVER' },
  { name: 'KW_TYPE', category: 'keyword', lexeme: 'TYPE' },
  { name: 'KW_UNIQUE', category: 'keyword', lexeme: 'UNIQUE' },
  { name: 'KW_UNTIL', category: 'keyword', lexeme: 'UNTIL' },
  { name: 'KW_USE', category: 'keyword', lexeme: 'USE' },
  { name: 'KW_VAR', category: 'keyword', lexeme: 'VAR' },
  { name: 'KW_WHERE', category: 'keyword', lexeme: 'WHERE' },
  { name: 'KW_WHILE', category: 'keyword', lexeme: 'WHILE' },
  { name: 'KW_WITH', category: 'keyword', lexeme: 'WITH' },
];

/**
 * EXPRESS operator keywords (e.g., AND, OR, LIKE).
 * These behave like operators but are written as identifiers.
 */
export const OPERATOR_KEYWORD_TOKENS: BaseToken[] = [
  { name: 'OP_AND', category: 'operator_keyword', lexeme: 'AND' },
  { name: 'OP_ANDOR', category: 'operator_keyword', lexeme: 'ANDOR' },
  { name: 'OP_DIV', category: 'operator_keyword', lexeme: 'DIV' },
  { name: 'OP_IN', category: 'operator_keyword', lexeme: 'IN' },
  { name: 'OP_LIKE', category: 'operator_keyword', lexeme: 'LIKE' },
  { name: 'OP_MOD', category: 'operator_keyword', lexeme: 'MOD' },
  { name: 'OP_NOT', category: 'operator_keyword', lexeme: 'NOT' },
  { name: 'OP_OR', category: 'operator_keyword', lexeme: 'OR' },
  { name: 'OP_XOR', category: 'operator_keyword', lexeme: 'XOR' },
];

/**
 * EXPRESS built-in constants, including '?', SELF, TRUE, FALSE, UNKNOWN.
 */
export const BUILTIN_CONSTANT_TOKENS: BaseToken[] = [
  {
    name: 'BC_QUESTION_MARK',
    category: 'builtin_constant_keyword',
    lexeme: '?',
  },

  {
    name: 'BC_SELF',
    category: 'builtin_constant_keyword',
    lexeme: 'SELF',
  },

  {
    name: 'BC_CONST_E',
    category: 'builtin_constant_keyword',
    lexeme: 'CONST_E',
  },

  {
    name: 'BC_PI',
    category: 'builtin_constant_keyword',
    lexeme: 'PI',
  },

  {
    name: 'BC_FALSE',
    category: 'builtin_constant_keyword',
    lexeme: 'FALSE',
  },
  {
    name: 'BC_TRUE',
    category: 'builtin_constant_keyword',
    lexeme: 'TRUE',
  },
  {
    name: 'BC_UNKNOWN',
    category: 'builtin_constant_keyword',
    lexeme: 'UNKNOWN',
  },
];

/**
 * EXPRESS built-in functions (ABS, SIZEOF, TYPEOF, VALUE, etc.).
 * These always behave like identifiers but belong to a reserved namespace.
 */
export const BUILTIN_FUNCTION_TOKENS: BaseToken[] = [
  { name: 'BF_ABS', category: 'builtin_function_keyword', lexeme: 'ABS' },
  { name: 'BF_ACOS', category: 'builtin_function_keyword', lexeme: 'ACOS' },
  { name: 'BF_ASIN', category: 'builtin_function_keyword', lexeme: 'ASIN' },
  { name: 'BF_ATAN', category: 'builtin_function_keyword', lexeme: 'ATAN' },
  {
    name: 'BF_BLENGTH',
    category: 'builtin_function_keyword',
    lexeme: 'BLENGTH',
  },
  { name: 'BF_COS', category: 'builtin_function_keyword', lexeme: 'COS' },
  { name: 'BF_EXISTS', category: 'builtin_function_keyword', lexeme: 'EXISTS' },
  { name: 'BF_EXP', category: 'builtin_function_keyword', lexeme: 'EXP' },
  { name: 'BF_FORMAT', category: 'builtin_function_keyword', lexeme: 'FORMAT' },
  {
    name: 'BF_HIBOUND',
    category: 'builtin_function_keyword',
    lexeme: 'HIBOUND',
  },
  {
    name: 'BF_HIINDEX',
    category: 'builtin_function_keyword',
    lexeme: 'HIINDEX',
  },
  { name: 'BF_LENGTH', category: 'builtin_function_keyword', lexeme: 'LENGTH' },
  {
    name: 'BF_LOBOUND',
    category: 'builtin_function_keyword',
    lexeme: 'LOBOUND',
  },
  { name: 'BF_LOG', category: 'builtin_function_keyword', lexeme: 'LOG' },
  { name: 'BF_LOG2', category: 'builtin_function_keyword', lexeme: 'LOG2' },
  { name: 'BF_LOG10', category: 'builtin_function_keyword', lexeme: 'LOG10' },
  {
    name: 'BF_LOINDEX',
    category: 'builtin_function_keyword',
    lexeme: 'LOINDEX',
  },
  { name: 'BF_NVL', category: 'builtin_function_keyword', lexeme: 'NVL' },
  { name: 'BF_ODD', category: 'builtin_function_keyword', lexeme: 'ODD' },
  {
    name: 'BF_ROLESOF',
    category: 'builtin_function_keyword',
    lexeme: 'ROLESOF',
  },
  { name: 'BF_SIN', category: 'builtin_function_keyword', lexeme: 'SIN' },
  { name: 'BF_SIZEOF', category: 'builtin_function_keyword', lexeme: 'SIZEOF' },
  { name: 'BF_SQRT', category: 'builtin_function_keyword', lexeme: 'SQRT' },
  { name: 'BF_TAN', category: 'builtin_function_keyword', lexeme: 'TAN' },
  { name: 'BF_TYPEOF', category: 'builtin_function_keyword', lexeme: 'TYPEOF' },
  { name: 'BF_USEDIN', category: 'builtin_function_keyword', lexeme: 'USEDIN' },
  { name: 'BF_VALUE', category: 'builtin_function_keyword', lexeme: 'VALUE' },
  {
    name: 'BF_VALUE_IN',
    category: 'builtin_function_keyword',
    lexeme: 'VALUE_IN',
  },
  {
    name: 'BF_VALUE_UNIQUE',
    category: 'builtin_function_keyword',
    lexeme: 'VALUE_UNIQUE',
  },
];

/**
 * EXPRESS built-in procedures (INSERT, REMOVE).
 */
export const BUILTIN_PROCEDURE_TOKENS: BaseToken[] = [
  {
    name: 'BP_INSERT',
    category: 'builtin_procedure_keyword',
    lexeme: 'INSERT',
  },
  {
    name: 'BP_REMOVE',
    category: 'builtin_procedure_keyword',
    lexeme: 'REMOVE',
  },
];

/**
 * EXPRESS symbolic tokens (operators, punctuation, delimiters).
 * The list includes both multi-character operators and single-character symbols.
 * Ordering does not matter here, because SYMBOLS_SORTED is created later.
 */
export const SYMBOL_TOKENS: BaseToken[] = [
  // Multi-character symbols
  { name: 'SYM_ASSIGN_EXT', category: 'symbol', lexeme: ':=:' },
  { name: 'SYM_NOT_EQUAL_EXT', category: 'symbol', lexeme: ':<>:' },
  { name: 'SYM_LESS_EQUAL', category: 'symbol', lexeme: '<=' },
  { name: 'SYM_GREATER_EQUAL', category: 'symbol', lexeme: '>=' },
  { name: 'SYM_NOT_EQUAL', category: 'symbol', lexeme: '<>' },
  { name: 'SYM_ASSIGN', category: 'symbol', lexeme: ':=' },
  { name: 'SYM_SUBTYPE_MARK', category: 'symbol', lexeme: '<*' },
  { name: 'SYM_OR_OR', category: 'symbol', lexeme: '||' },
  { name: 'SYM_EXPONENT', category: 'symbol', lexeme: '**' },
  // comment markers
  { name: 'SYM_REMARK_LINE', category: 'symbol', lexeme: '--' },
  { name: 'SYM_REMARK_BLOCK_START', category: 'symbol', lexeme: '(*' },
  { name: 'SYM_REMARK_BLOCK_END', category: 'symbol', lexeme: '*)' },
  // One-character symbols
  { name: 'SYM_DOT', category: 'symbol', lexeme: '.' },
  { name: 'SYM_COMMA', category: 'symbol', lexeme: ',' },
  { name: 'SYM_SEMICOLON', category: 'symbol', lexeme: ';' },
  { name: 'SYM_COLON', category: 'symbol', lexeme: ':' },
  { name: 'SYM_STAR', category: 'symbol', lexeme: '*' },
  { name: 'SYM_PLUS', category: 'symbol', lexeme: '+' },
  { name: 'SYM_MINUS', category: 'symbol', lexeme: '-' },
  { name: 'SYM_EQUAL', category: 'symbol', lexeme: '=' },
  { name: 'SYM_PERCENT', category: 'symbol', lexeme: '%' },
  { name: 'SYM_QUOTE', category: 'symbol', lexeme: "'" },
  { name: 'SYM_BACKSLASH', category: 'symbol', lexeme: '\\' },
  { name: 'SYM_SLASH', category: 'symbol', lexeme: '/' },
  { name: 'SYM_LESS', category: 'symbol', lexeme: '<' },
  { name: 'SYM_GREATER', category: 'symbol', lexeme: '>' },
  { name: 'SYM_LBRACKET', category: 'symbol', lexeme: '[' },
  { name: 'SYM_RBRACKET', category: 'symbol', lexeme: ']' },
  { name: 'SYM_LBRACE', category: 'symbol', lexeme: '{' },
  { name: 'SYM_RBRACE', category: 'symbol', lexeme: '}' },
  { name: 'SYM_PIPE', category: 'symbol', lexeme: '|' },
  { name: 'SYM_LPAREN', category: 'symbol', lexeme: '(' },
  { name: 'SYM_RPAREN', category: 'symbol', lexeme: ')' },
];
