import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';

describe('lexP21 — comments', () => {
  it('skips single-line comment', () => {
    const result = lexP21('/* this is a comment */ HEADER');
    const nonEof = result.tokens.filter((t) => t.kind !== 'EOF');
    expect(nonEof).toHaveLength(1);
    expect(nonEof[0]!.kind).toBe('KW_HEADER');
  });

  it('skips multiline comment', () => {
    const result = lexP21('/* line 1\nline 2\nline 3 */ DATA');
    const nonEof = result.tokens.filter((t) => t.kind !== 'EOF');
    expect(nonEof).toHaveLength(1);
    expect(nonEof[0]!.kind).toBe('KW_DATA');
  });

  it('handles adjacent comments', () => {
    const result = lexP21('/* first */ /* second */ ENDSEC');
    const nonEof = result.tokens.filter((t) => t.kind !== 'EOF');
    expect(nonEof).toHaveLength(1);
    expect(nonEof[0]!.kind).toBe('KW_ENDSEC');
  });

  it('reports unterminated comment', () => {
    const result = lexP21('/* unterminated comment');
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]!.code).toBe('P21L001');
  });

  it('handles comment within entity data', () => {
    const result = lexP21('#1=CPT(0.0,0.0,0.0); /* cartesian point */');
    const kinds = result.tokens
      .filter((t) => t.kind !== 'EOF')
      .map((t) => t.kind);
    expect(kinds).toEqual([
      'ENTITY_INSTANCE_NAME',
      'SYM_EQUALS',
      'STANDARD_KEYWORD',
      'SYM_LPAREN',
      'REAL',
      'SYM_COMMA',
      'REAL',
      'SYM_COMMA',
      'REAL',
      'SYM_RPAREN',
      'SYM_SEMICOLON',
    ]);
  });
});
