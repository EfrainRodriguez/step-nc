import type {
  DeclarationNode,
  InterfaceClauseNode,
  ReferenceClauseNode,
  RenamedRefNode,
  SchemaDeclarationNode,
  UseClauseNode,
} from '../ast/declarations';
import {
  isStartOfDeclaration,
  parseCommaSeparatedList,
  parseIdentifier,
  parseSemicolon,
  SYNC_DECLARATION,
  synchronize,
} from './common';
import { ParserContext } from './context';
import { parseDeclaration } from './declarations';
import { spanOfToken } from './types';

// ── Public API ──────────────────────────────────────────────────────

export function parseSchema(ctx: ParserContext): SchemaDeclarationNode {
  const start = ctx.startPos();
  ctx.expect('KW_SCHEMA');
  const name = parseIdentifier(ctx);

  let versionId: string | undefined;
  if (ctx.check('LIT_STRING')) {
    const raw = ctx.consume().text;
    versionId = raw.length >= 2 ? raw.slice(1, -1) : raw;
  }

  parseSemicolon(ctx);

  const interfaces: InterfaceClauseNode[] = [];
  while (ctx.check('KW_USE') || ctx.check('KW_REFERENCE')) {
    if (ctx.check('KW_USE')) {
      interfaces.push(parseUseClause(ctx));
    } else {
      interfaces.push(parseReferenceClause(ctx));
    }
  }

  const declarations = parseSchemaBodyDeclarations(ctx);

  ctx.expect('KW_END_SCHEMA');
  parseSemicolon(ctx);

  return {
    type: 'SchemaDeclaration',
    name,
    ...(versionId !== undefined ? { versionId } : {}),
    interfaces,
    declarations,
    span: ctx.spanFrom(start),
  };
}

// ── USE Clause ──────────────────────────────────────────────────────

function parseUseClause(ctx: ParserContext): UseClauseNode {
  const start = ctx.startPos();
  ctx.expect('KW_USE');
  ctx.expect('KW_FROM');
  const schemaName = parseIdentifier(ctx);

  let items: RenamedRefNode[] | undefined;
  if (ctx.check('SYM_LPAREN')) {
    ctx.consume();
    items = parseCommaSeparatedList(ctx, parseRenamedRef, 'SYM_RPAREN');
    ctx.expect('SYM_RPAREN');
  }

  parseSemicolon(ctx);
  return {
    type: 'UseClause',
    schemaName,
    ...(items ? { items } : {}),
    span: ctx.spanFrom(start),
  };
}

// ── REFERENCE Clause ────────────────────────────────────────────────

function parseReferenceClause(ctx: ParserContext): ReferenceClauseNode {
  const start = ctx.startPos();
  ctx.expect('KW_REFERENCE');
  ctx.expect('KW_FROM');
  const schemaName = parseIdentifier(ctx);

  let items: RenamedRefNode[] | undefined;
  if (ctx.check('SYM_LPAREN')) {
    ctx.consume();
    items = parseCommaSeparatedList(ctx, parseRenamedRef, 'SYM_RPAREN');
    ctx.expect('SYM_RPAREN');
  }

  parseSemicolon(ctx);
  return {
    type: 'ReferenceClause',
    schemaName,
    ...(items ? { items } : {}),
    span: ctx.spanFrom(start),
  };
}

// ── Renamed Ref ─────────────────────────────────────────────────────

function parseRenamedRef(ctx: ParserContext): RenamedRefNode {
  const start = ctx.startPos();
  const name = parseIdentifier(ctx);
  let alias: string | undefined;
  if (ctx.skip('KW_AS')) {
    alias = parseIdentifier(ctx);
  }
  return {
    type: 'RenamedRef',
    name,
    ...(alias !== undefined ? { alias } : {}),
    span: ctx.spanFrom(start),
  };
}

// ── Schema Body Declarations ────────────────────────────────────────

function parseSchemaBodyDeclarations(ctx: ParserContext): DeclarationNode[] {
  const declarations: DeclarationNode[] = [];

  while (!ctx.isEOF() && !ctx.check('KW_END_SCHEMA')) {
    if (isStartOfDeclaration(ctx.current().kind)) {
      declarations.push(parseDeclaration(ctx));
    } else {
      ctx.error(
        'PAR070',
        `Unexpected token '${ctx.current().kind}' in schema body`,
        spanOfToken(ctx.current()),
      );
      synchronize(ctx, SYNC_DECLARATION);
    }
  }

  return declarations;
}
