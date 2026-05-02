import { describe, expect, it } from 'vitest';
import { lexExpress } from '../../src/lexer/lexer';
import {
  isEndKeyword,
  isStartOfDeclaration,
  parseCommaSeparatedList,
  parseIdentifier,
  parseSemicolon,
  SYNC_STATEMENT,
  synchronize,
} from '../../src/parser/common';
import { ParserContext } from '../../src/parser/context';

function makeCtx(source: string): ParserContext {
  const { tokens } = lexExpress(source);
  return new ParserContext(tokens);
}

describe('synchronize', () => {
  it('should advance to the sync token', () => {
    const ctx = makeCtx('a b c ;');
    synchronize(ctx, SYNC_STATEMENT);
    expect(ctx.current().kind).toBe('SYM_SEMICOLON');
  });

  it('should stop at EOF if no sync token found', () => {
    const ctx = makeCtx('a b c');
    synchronize(ctx, SYNC_STATEMENT);
    expect(ctx.isEOF()).toBe(true);
  });

  it('should not advance if already at sync token', () => {
    const ctx = makeCtx('; a b');
    synchronize(ctx, SYNC_STATEMENT);
    expect(ctx.current().kind).toBe('SYM_SEMICOLON');
  });
});

describe('parseIdentifier', () => {
  it('should consume and return identifier text', () => {
    const ctx = makeCtx('my_name ;');
    const name = parseIdentifier(ctx);
    expect(name).toBe('my_name');
    expect(ctx.current().kind).toBe('SYM_SEMICOLON');
  });

  it('should emit error and return <error> if not IDENT', () => {
    const ctx = makeCtx('42 ;');
    const name = parseIdentifier(ctx);
    expect(name).toBe('<error>');
    expect(ctx.diagnostics).toHaveLength(1);
    expect(ctx.diagnostics[0]!.code).toBe('PAR001');
  });
});

describe('parseCommaSeparatedList', () => {
  it('should parse empty list', () => {
    const ctx = makeCtx(')');
    const items = parseCommaSeparatedList(
      ctx,
      (c) => parseIdentifier(c),
      'SYM_RPAREN',
    );
    expect(items).toEqual([]);
  });

  it('should parse single item', () => {
    const ctx = makeCtx('alpha )');
    const items = parseCommaSeparatedList(
      ctx,
      (c) => parseIdentifier(c),
      'SYM_RPAREN',
    );
    expect(items).toEqual(['alpha']);
  });

  it('should parse multiple items', () => {
    const ctx = makeCtx('a , b , c )');
    const items = parseCommaSeparatedList(
      ctx,
      (c) => parseIdentifier(c),
      'SYM_RPAREN',
    );
    expect(items).toEqual(['a', 'b', 'c']);
  });
});

describe('parseSemicolon', () => {
  it('should consume semicolon', () => {
    const ctx = makeCtx('; foo');
    parseSemicolon(ctx);
    expect(ctx.current().kind).toBe('IDENT');
    expect(ctx.diagnostics).toHaveLength(0);
  });

  it('should emit diagnostic if semicolon missing', () => {
    const ctx = makeCtx('foo bar');
    parseSemicolon(ctx);
    expect(ctx.diagnostics).toHaveLength(1);
    expect(ctx.diagnostics[0]!.code).toBe('PAR050');
    // Should NOT consume the unexpected token
    expect(ctx.current().text).toBe('foo');
  });
});

describe('isStartOfDeclaration', () => {
  it('should return true for declaration keywords', () => {
    expect(isStartOfDeclaration('KW_ENTITY')).toBe(true);
    expect(isStartOfDeclaration('KW_TYPE')).toBe(true);
    expect(isStartOfDeclaration('KW_FUNCTION')).toBe(true);
    expect(isStartOfDeclaration('KW_PROCEDURE')).toBe(true);
    expect(isStartOfDeclaration('KW_RULE')).toBe(true);
    expect(isStartOfDeclaration('KW_SUBTYPE_CONSTRAINT')).toBe(true);
    expect(isStartOfDeclaration('KW_CONSTANT')).toBe(true);
  });

  it('should return false for non-declaration keywords', () => {
    expect(isStartOfDeclaration('KW_IF')).toBe(false);
    expect(isStartOfDeclaration('IDENT')).toBe(false);
    expect(isStartOfDeclaration('SYM_SEMICOLON')).toBe(false);
  });
});

describe('isEndKeyword', () => {
  it('should return true for END_* keywords', () => {
    expect(isEndKeyword('KW_END_ENTITY')).toBe(true);
    expect(isEndKeyword('KW_END_TYPE')).toBe(true);
    expect(isEndKeyword('KW_END_FUNCTION')).toBe(true);
    expect(isEndKeyword('KW_END_SCHEMA')).toBe(true);
  });

  it('should return false for non-END keywords', () => {
    expect(isEndKeyword('KW_ENTITY')).toBe(false);
    expect(isEndKeyword('IDENT')).toBe(false);
  });
});
