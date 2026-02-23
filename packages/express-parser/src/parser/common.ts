import type { IdentifierRefNode } from '../ast/expressions';
import type { TokenKind } from '../lexer/types';
import { ParserContext } from './context';
import { spanOfToken } from './types';

// ── Synchronization Token Sets ──────────────────────────────────────

export const SYNC_DECLARATION: ReadonlySet<TokenKind> = new Set<TokenKind>([
  'KW_ENTITY',
  'KW_TYPE',
  'KW_FUNCTION',
  'KW_PROCEDURE',
  'KW_RULE',
  'KW_SUBTYPE_CONSTRAINT',
  'KW_CONSTANT',
  'KW_END_SCHEMA',
  'EOF',
]);

export const SYNC_STATEMENT: ReadonlySet<TokenKind> = new Set<TokenKind>([
  'SYM_SEMICOLON',
  'KW_END_IF',
  'KW_END_CASE',
  'KW_END_REPEAT',
  'KW_END_ALIAS',
  'KW_END_FUNCTION',
  'KW_END_PROCEDURE',
  'KW_END_RULE',
  'KW_END_ENTITY',
  'KW_END_SCHEMA',
  'EOF',
]);

export const SYNC_EXPRESSION: ReadonlySet<TokenKind> = new Set<TokenKind>([
  'SYM_SEMICOLON',
  'SYM_RPAREN',
  'SYM_RBRACKET',
  'SYM_RBRACE',
  'EOF',
]);

// ── Helper Functions ────────────────────────────────────────────────

/** Advance the parser until a token in `syncTokens` is found (or EOF). */
export function synchronize(
  ctx: ParserContext,
  syncTokens: ReadonlySet<TokenKind>,
): void {
  while (!ctx.isEOF() && !syncTokens.has(ctx.current().kind)) {
    ctx.consume();
  }
}

/** Consume an IDENT token and return its text. Emits error if not IDENT. */
export function parseIdentifier(ctx: ParserContext): string {
  const token = ctx.current();
  if (token.kind === 'IDENT') {
    ctx.consume();
    return token.text;
  }
  ctx.error(
    'PAR001',
    `Expected identifier but found '${token.kind}'`,
    spanOfToken(token),
  );
  return '<error>';
}

/**
 * Like parseIdentifier but also accepts built-in function/procedure/constant
 * names as valid identifiers (for contexts where EXPRESS allows redefining names).
 */
export function parseIdentifierOrBuiltin(ctx: ParserContext): string {
  const token = ctx.current();
  if (
    token.kind === 'IDENT' ||
    token.kind.startsWith('BF_') ||
    token.kind.startsWith('BP_') ||
    token.kind.startsWith('BC_')
  ) {
    ctx.consume();
    return token.text;
  }
  ctx.error(
    'PAR001',
    `Expected identifier but found '${token.kind}'`,
    spanOfToken(token),
  );
  return '<error>';
}

/**
 * Parse a comma-separated list: `item { ',' item }` until `closeToken`.
 * Does NOT consume the closeToken.
 */
export function parseCommaSeparatedList<T>(
  ctx: ParserContext,
  parseItem: (ctx: ParserContext) => T,
  closeToken: TokenKind,
): T[] {
  const items: T[] = [];
  if (ctx.check(closeToken)) return items;

  items.push(parseItem(ctx));
  while (ctx.skip('SYM_COMMA')) {
    items.push(parseItem(ctx));
  }
  return items;
}

/**
 * Expect and consume a semicolon. If missing, emit a diagnostic but
 * continue parsing (do not consume the unexpected token).
 */
export function parseSemicolon(ctx: ParserContext): void {
  if (ctx.check('SYM_SEMICOLON')) {
    ctx.consume();
    return;
  }
  const token = ctx.current();
  ctx.error(
    'PAR050',
    `Missing semicolon before '${token.kind}'`,
    spanOfToken(token),
  );
}

/** Returns true if the TokenKind starts a declaration. */
export function isStartOfDeclaration(kind: TokenKind): boolean {
  return (
    kind === 'KW_ENTITY' ||
    kind === 'KW_TYPE' ||
    kind === 'KW_FUNCTION' ||
    kind === 'KW_PROCEDURE' ||
    kind === 'KW_RULE' ||
    kind === 'KW_SUBTYPE_CONSTRAINT' ||
    kind === 'KW_CONSTANT'
  );
}

/** Returns true if the TokenKind is an END_* keyword. */
export function isEndKeyword(kind: TokenKind): boolean {
  return (
    kind === 'KW_END_ENTITY' ||
    kind === 'KW_END_TYPE' ||
    kind === 'KW_END_FUNCTION' ||
    kind === 'KW_END_PROCEDURE' ||
    kind === 'KW_END_RULE' ||
    kind === 'KW_END_SUBTYPE_CONSTRAINT' ||
    kind === 'KW_END_SCHEMA' ||
    kind === 'KW_END_IF' ||
    kind === 'KW_END_CASE' ||
    kind === 'KW_END_REPEAT' ||
    kind === 'KW_END_ALIAS' ||
    kind === 'KW_END_CONSTANT' ||
    kind === 'KW_END_LOCAL' ||
    kind === 'KW_END'
  );
}

/** Returns true if the TokenKind is a built-in function token. */
export function isBuiltinFunction(kind: TokenKind): boolean {
  return typeof kind === 'string' && kind.startsWith('BF_');
}

/** Returns true if the TokenKind is a built-in procedure token. */
export function isBuiltinProcedure(kind: TokenKind): boolean {
  return kind === 'BP_INSERT' || kind === 'BP_REMOVE';
}

/**
 * Create an error IdentifierRefNode to use as a placeholder
 * when an expression cannot be parsed.
 */
export function errorExpression(ctx: ParserContext): IdentifierRefNode {
  const token = ctx.current();
  return {
    type: 'IdentifierRef',
    name: '<error>',
    span: spanOfToken(token),
  };
}
