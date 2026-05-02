export type P21TokenKind =
  // Section delimiters
  | 'KW_ISO_10303_21'
  | 'KW_END_ISO_10303_21'
  | 'KW_HEADER'
  | 'KW_ENDSEC'
  | 'KW_DATA'
  | 'KW_ANCHOR'
  | 'KW_REFERENCE'
  | 'KW_SIGNATURE'

  // Literals & references
  | 'STANDARD_KEYWORD'
  | 'USER_DEFINED_KEYWORD'
  | 'INTEGER'
  | 'REAL'
  | 'STRING'
  | 'BINARY'
  | 'ENUMERATION'
  | 'ENTITY_INSTANCE_NAME'
  | 'VALUE_INSTANCE_NAME'
  | 'CONSTANT_ENTITY_NAME'
  | 'CONSTANT_VALUE_NAME'
  | 'ANCHOR_NAME'
  | 'RESOURCE'
  | 'TAG_NAME'
  | 'SIGNATURE_CONTENT'

  // Symbols
  | 'SYM_SEMICOLON'
  | 'SYM_COMMA'
  | 'SYM_LPAREN'
  | 'SYM_RPAREN'
  | 'SYM_EQUALS'
  | 'SYM_DOLLAR'
  | 'SYM_STAR'
  | 'SYM_PLUS'
  | 'SYM_MINUS'
  | 'SYM_HASH'
  | 'SYM_LBRACE'
  | 'SYM_RBRACE'
  | 'SYM_COLON'
  | 'SYM_SLASH'

  // Special
  | 'EOF';

export interface P21Token {
  readonly kind: P21TokenKind;
  readonly text: string;
  readonly offset: number;
  readonly line: number;
  readonly column: number;
}

export interface P21LexDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly offset: number;
  readonly line: number;
  readonly column: number;
  readonly severity: 'error' | 'warning';
}
