import type { P21TokenKind } from './types';

export const SECTION_KEYWORD_MAP: Record<string, P21TokenKind> = {
  HEADER: 'KW_HEADER',
  ENDSEC: 'KW_ENDSEC',
  DATA: 'KW_DATA',
  ANCHOR: 'KW_ANCHOR',
  REFERENCE: 'KW_REFERENCE',
  SIGNATURE: 'KW_SIGNATURE',
};

export const SYMBOL_MAP: Record<string, P21TokenKind> = {
  ';': 'SYM_SEMICOLON',
  ',': 'SYM_COMMA',
  '(': 'SYM_LPAREN',
  ')': 'SYM_RPAREN',
  '=': 'SYM_EQUALS',
  $: 'SYM_DOLLAR',
  '*': 'SYM_STAR',
  '+': 'SYM_PLUS',
  '-': 'SYM_MINUS',
  '{': 'SYM_LBRACE',
  '}': 'SYM_RBRACE',
  ':': 'SYM_COLON',
  '/': 'SYM_SLASH',
};
