import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';

describe('lexP21 — basic tokens', () => {
  it('lexes ISO delimiters', () => {
    const result = lexP21('ISO-10303-21;END-ISO-10303-21;');
    const kinds = result.tokens.map((t) => t.kind);
    expect(kinds).toEqual([
      'KW_ISO_10303_21',
      'SYM_SEMICOLON',
      'KW_END_ISO_10303_21',
      'SYM_SEMICOLON',
      'EOF',
    ]);
  });

  it('lexes section keywords', () => {
    const result = lexP21('HEADER ENDSEC DATA ANCHOR REFERENCE SIGNATURE');
    const kinds = result.tokens
      .filter((t) => t.kind !== 'EOF')
      .map((t) => t.kind);
    expect(kinds).toEqual([
      'KW_HEADER',
      'KW_ENDSEC',
      'KW_DATA',
      'KW_ANCHOR',
      'KW_REFERENCE',
      'KW_SIGNATURE',
    ]);
  });

  it('lexes standard keywords', () => {
    const result = lexP21('FILE_NAME CPT ED_STRC');
    const kinds = result.tokens
      .filter((t) => t.kind !== 'EOF')
      .map((t) => t.kind);
    expect(kinds).toEqual([
      'STANDARD_KEYWORD',
      'STANDARD_KEYWORD',
      'STANDARD_KEYWORD',
    ]);
    expect(result.tokens[0]!.text).toBe('FILE_NAME');
    expect(result.tokens[1]!.text).toBe('CPT');
    expect(result.tokens[2]!.text).toBe('ED_STRC');
  });

  it('lexes user-defined keywords', () => {
    const result = lexP21('!CUSTOM_ENTITY');
    expect(result.tokens[0]!.kind).toBe('USER_DEFINED_KEYWORD');
    expect(result.tokens[0]!.text).toBe('!CUSTOM_ENTITY');
  });

  it('lexes symbols', () => {
    const result = lexP21(';,()=$*+-{}:');
    const kinds = result.tokens
      .filter((t) => t.kind !== 'EOF')
      .map((t) => t.kind);
    expect(kinds).toEqual([
      'SYM_SEMICOLON',
      'SYM_COMMA',
      'SYM_LPAREN',
      'SYM_RPAREN',
      'SYM_EQUALS',
      'SYM_DOLLAR',
      'SYM_STAR',
      'SYM_PLUS',
      'SYM_MINUS',
      'SYM_LBRACE',
      'SYM_RBRACE',
      'SYM_COLON',
    ]);
  });

  it('produces EOF token at end', () => {
    const result = lexP21('');
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0]!.kind).toBe('EOF');
  });

  it('skips whitespace', () => {
    const result = lexP21('  \t\n  HEADER  \n  ');
    const nonEof = result.tokens.filter((t) => t.kind !== 'EOF');
    expect(nonEof).toHaveLength(1);
    expect(nonEof[0]!.kind).toBe('KW_HEADER');
  });

  it('tracks line and column correctly', () => {
    const result = lexP21('HEADER\nDATA');
    const header = result.tokens[0]!;
    const data = result.tokens[1]!;
    expect(header.line).toBe(1);
    expect(header.column).toBe(1);
    expect(data.line).toBe(2);
    expect(data.column).toBe(1);
  });
});
