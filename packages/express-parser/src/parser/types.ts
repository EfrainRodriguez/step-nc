import type { Position, Span } from '../ast/base';
import type { ExpressionNode } from '../ast/expressions';
import type { AggregationKind, SimpleTypeKind, TypeNode } from '../ast/types';
import type { Token, TokenKind } from '../lexer/types';
import { parseCommaSeparatedList, parseIdentifier } from './common';
import { ParserContext } from './context';
import { parseExpression } from './expressions';

// ── Parse options and defaults ───────────────────────────────────────

/** Default max explicit attributes per entity (safety limit). */
export const DEFAULT_MAX_EXPLICIT_ATTRIBUTES = 10000;

/** Default max items in DERIVE/INVERSE sections per entity (safety limit). */
export const DEFAULT_MAX_ENTITY_SECTION_ITEMS = 10000;

export interface ParseOptions {
  /** Max explicit attributes in an entity (default: DEFAULT_MAX_EXPLICIT_ATTRIBUTES). */
  maxExplicitAttributes?: number;
  /** Max items in DERIVE/INVERSE sections per entity (default: DEFAULT_MAX_ENTITY_SECTION_ITEMS). */
  maxEntitySectionItems?: number;
}

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

// ── Type Parser (Commit 3) ─────────────────────────────────────────────

export function parseType(ctx: ParserContext): TypeNode {
  const token = ctx.current();

  switch (token.kind) {
    // Simple types
    case 'KW_INTEGER':
    case 'KW_REAL':
    case 'KW_NUMBER':
    case 'KW_STRING':
    case 'KW_BOOLEAN':
    case 'KW_LOGICAL':
    case 'KW_BINARY':
      return parseSimpleType(ctx);

    // Aggregation types
    case 'KW_ARRAY':
    case 'KW_BAG':
    case 'KW_LIST':
    case 'KW_SET':
      return parseAggregationType(ctx);

    // Constructed types
    case 'KW_ENUMERATION':
      return parseEnumerationType(ctx);
    case 'KW_SELECT':
      return parseSelectType(ctx);
    case 'KW_EXTENSIBLE': {
      const next = ctx.peek(1);
      if (next.kind === 'KW_ENUMERATION') return parseEnumerationType(ctx);
      return parseSelectType(ctx);
    }

    // Generic types
    case 'KW_GENERIC':
      return parseGenericType(ctx);
    case 'KW_GENERIC_ENTITY':
      return parseGenericEntityType(ctx);

    // Aggregate type
    case 'KW_AGGREGATE':
      return parseAggregateType(ctx);

    // Named type (user-defined) — IDENT or built-in names used as type (e.g. "length" → BF_LENGTH)
    case 'IDENT':
      return parseNamedType(ctx);
    default:
      if (
        token.kind.startsWith('BF_') ||
        token.kind.startsWith('BP_') ||
        token.kind.startsWith('BC_')
      ) {
        const start = ctx.startPos();
        const name = ctx.consume().text;
        return { type: 'NamedType', name, span: ctx.spanFrom(start) };
      }
      ctx.error(
        'PAR020',
        `Expected type, found '${token.kind}'`,
        spanOfToken(token),
      );
      return { type: 'NamedType', name: '<error>', span: spanOfToken(token) };
  }
}

const SIMPLE_TYPE_MAP: Partial<Record<TokenKind, SimpleTypeKind>> = {
  KW_INTEGER: 'INTEGER',
  KW_REAL: 'REAL',
  KW_NUMBER: 'NUMBER',
  KW_STRING: 'STRING',
  KW_BOOLEAN: 'BOOLEAN',
  KW_LOGICAL: 'LOGICAL',
  KW_BINARY: 'BINARY',
};

function parseSimpleType(ctx: ParserContext): TypeNode {
  const start = ctx.startPos();
  const token = ctx.consume();
  const kind = SIMPLE_TYPE_MAP[token.kind]!;

  // STRING(width), BINARY(width) FIXED, REAL(precision) — skip width for now
  if (ctx.check('SYM_LPAREN')) {
    ctx.consume();
    parseExpression(ctx, 0); // consume width expression
    ctx.expect('SYM_RPAREN');
    ctx.skip('KW_FIXED');
  }

  return { type: 'SimpleType', kind, span: ctx.spanFrom(start) };
}

const AGGREGATION_KIND_MAP: Partial<Record<TokenKind, AggregationKind>> = {
  KW_ARRAY: 'ARRAY',
  KW_BAG: 'BAG',
  KW_LIST: 'LIST',
  KW_SET: 'SET',
};

function parseAggregationType(ctx: ParserContext): TypeNode {
  const start = ctx.startPos();
  const token = ctx.consume();
  const kind = AGGREGATION_KIND_MAP[token.kind]!;

  let bounds: { lower?: ExpressionNode; upper?: ExpressionNode } | undefined;
  if (ctx.check('SYM_LBRACKET')) {
    bounds = parseBoundSpec(ctx);
  }

  ctx.expect('KW_OF');

  ctx.skip('KW_OPTIONAL');
  ctx.skip('KW_UNIQUE');

  const baseType = parseType(ctx);

  return {
    type: 'AggregationType',
    kind,
    ...(bounds ? { bounds } : {}),
    baseType,
    span: ctx.spanFrom(start),
  };
}

function parseBoundSpec(ctx: ParserContext): {
  lower?: ExpressionNode;
  upper?: ExpressionNode;
} {
  ctx.expect('SYM_LBRACKET');
  const lower = parseExpression(ctx, 0);
  ctx.expect('SYM_COLON');
  const upper = parseExpression(ctx, 0);
  ctx.expect('SYM_RBRACKET');
  return { lower, upper };
}

function parseEnumerationType(ctx: ParserContext): TypeNode {
  const start = ctx.startPos();

  const extensible = ctx.skip('KW_EXTENSIBLE');
  ctx.expect('KW_ENUMERATION');

  let basedOn: string | undefined;
  const values: string[] = [];

  if (ctx.skip('KW_OF')) {
    ctx.expect('SYM_LPAREN');
    const items = parseCommaSeparatedList(ctx, parseIdentifier, 'SYM_RPAREN');
    values.push(...items);
    ctx.expect('SYM_RPAREN');
  } else if (ctx.skip('KW_BASED_ON')) {
    basedOn = parseIdentifier(ctx);
    if (ctx.skip('KW_WITH')) {
      ctx.expect('SYM_LPAREN');
      const items = parseCommaSeparatedList(ctx, parseIdentifier, 'SYM_RPAREN');
      values.push(...items);
      ctx.expect('SYM_RPAREN');
    }
  }

  return {
    type: 'EnumerationType',
    ...(extensible ? { extensible: true } : {}),
    ...(basedOn !== undefined ? { basedOn } : {}),
    values,
    span: ctx.spanFrom(start),
  };
}

function parseSelectType(ctx: ParserContext): TypeNode {
  const start = ctx.startPos();

  const extensible = ctx.skip('KW_EXTENSIBLE');
  const generic = ctx.skip('KW_GENERIC_ENTITY');
  ctx.expect('KW_SELECT');

  let basedOn: string[] | undefined;
  const types: string[] = [];

  if (ctx.skip('SYM_LPAREN')) {
    const items = parseCommaSeparatedList(ctx, parseIdentifier, 'SYM_RPAREN');
    types.push(...items);
    ctx.expect('SYM_RPAREN');
  } else if (ctx.skip('KW_BASED_ON')) {
    const baseTypeName = parseIdentifier(ctx);
    basedOn = [baseTypeName];
    if (ctx.skip('KW_WITH')) {
      ctx.expect('SYM_LPAREN');
      const items = parseCommaSeparatedList(ctx, parseIdentifier, 'SYM_RPAREN');
      types.push(...items);
      ctx.expect('SYM_RPAREN');
    }
  }

  return {
    type: 'SelectType',
    ...(extensible ? { extensible: true } : {}),
    ...(generic ? { generic: true } : {}),
    ...(basedOn !== undefined ? { basedOn } : {}),
    types,
    span: ctx.spanFrom(start),
  };
}

function parseNamedType(ctx: ParserContext): TypeNode {
  const start = ctx.startPos();
  const name = parseIdentifier(ctx);
  return { type: 'NamedType', name, span: ctx.spanFrom(start) };
}

function parseGenericType(ctx: ParserContext): TypeNode {
  const start = ctx.startPos();
  ctx.expect('KW_GENERIC');
  if (ctx.skip('SYM_COLON')) {
    parseIdentifier(ctx);
  }
  return { type: 'GenericType', span: ctx.spanFrom(start) };
}

function parseGenericEntityType(ctx: ParserContext): TypeNode {
  const start = ctx.startPos();
  ctx.expect('KW_GENERIC_ENTITY');
  if (ctx.skip('SYM_COLON')) {
    parseIdentifier(ctx);
  }
  return { type: 'GenericEntityType', span: ctx.spanFrom(start) };
}

function parseAggregateType(ctx: ParserContext): TypeNode {
  const start = ctx.startPos();
  ctx.expect('KW_AGGREGATE');
  if (ctx.skip('SYM_COLON')) {
    parseIdentifier(ctx);
  }
  ctx.expect('KW_OF');
  const baseType = parseType(ctx);
  return { type: 'AggregateType', baseType, span: ctx.spanFrom(start) };
}
