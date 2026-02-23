import type { ExpressionNode } from '../ast/expressions';
import type {
  CaseActionNode,
  RepeatControlNode,
  StatementNode,
} from '../ast/statements';
import type { TokenKind } from '../lexer/types';
import {
  isBuiltinProcedure,
  isEndKeyword,
  isStartOfDeclaration,
  parseCommaSeparatedList,
  parseIdentifier,
  parseSemicolon,
  SYNC_STATEMENT,
  synchronize,
} from './common';
import { ParserContext } from './context';
import { parseExpression, parsePrimary, parseQualifiers } from './expressions';
import { spanOfToken } from './types';

// ── Public API ──────────────────────────────────────────────────────

export function parseStatement(ctx: ParserContext): StatementNode {
  const token = ctx.current();

  switch (token.kind) {
    case 'SYM_SEMICOLON': {
      const start = ctx.startPos();
      ctx.consume();
      return { type: 'NullStatement', span: ctx.spanFrom(start) };
    }

    case 'KW_IF':
      return parseIfStatement(ctx);
    case 'KW_CASE':
      return parseCaseStatement(ctx);
    case 'KW_REPEAT':
      return parseRepeatStatement(ctx);
    case 'KW_ALIAS':
      return parseAliasStatement(ctx);
    case 'KW_RETURN':
      return parseReturnStatement(ctx);
    case 'KW_BEGIN':
      return parseCompoundStatement(ctx);

    case 'KW_SKIP': {
      const start = ctx.startPos();
      ctx.consume();
      parseSemicolon(ctx);
      return { type: 'SkipStatement', span: ctx.spanFrom(start) };
    }

    case 'KW_ESCAPE': {
      const start = ctx.startPos();
      ctx.consume();
      parseSemicolon(ctx);
      return { type: 'EscapeStatement', span: ctx.spanFrom(start) };
    }

    case 'IDENT':
    case 'BC_SELF':
    case 'KW_ENTITY':
    case 'KW_TYPE':
    case 'KW_LIST':
    case 'KW_ARRAY':
    case 'KW_BAG':
    case 'KW_SET':
      return parseAssignmentOrProcedureCall(ctx);

    default:
      if (isBuiltinProcedure(token.kind)) {
        return parseBuiltinProcedureCall(ctx);
      }
      ctx.error(
        'PAR030',
        `Expected statement, found '${token.kind}'`,
        spanOfToken(token),
      );
      synchronize(ctx, SYNC_STATEMENT);
      if (ctx.check('SYM_SEMICOLON')) ctx.consume();
      return { type: 'NullStatement', span: spanOfToken(token) };
  }
}

/** Parse statements until one of the endTokens is reached, a declaration starts, or an outer END_* is seen (error recovery). */
export function parseStatementList(
  ctx: ParserContext,
  ...endTokens: TokenKind[]
): StatementNode[] {
  const endSet = new Set<TokenKind>(endTokens);
  const statements: StatementNode[] = [];
  while (!ctx.isEOF()) {
    const kind = ctx.current().kind;
    if (endSet.has(kind)) break;
    if (isStartOfDeclaration(kind)) break;
    if (isEndKeyword(kind) && !endSet.has(kind)) break;
    statements.push(parseStatement(ctx));
  }
  return statements;
}

// ── Disambiguation: Assignment vs ProcedureCall ─────────────────────

function parseAssignmentOrProcedureCall(ctx: ParserContext): StatementNode {
  const start = ctx.startPos();

  const ref = parseQualifiers(ctx, parsePrimary(ctx));

  if (ctx.check('SYM_ASSIGN')) {
    ctx.consume();
    const value = parseExpression(ctx, 0);
    parseSemicolon(ctx);
    return {
      type: 'AssignmentStatement',
      target: ref,
      value,
      span: ctx.spanFrom(start),
    };
  }

  if (ref.type === 'FunctionCallExpression') {
    parseSemicolon(ctx);
    return {
      type: 'ProcedureCallStatement',
      procedure: ref.name,
      args: [...ref.args],
      span: ctx.spanFrom(start),
    };
  }

  if (ref.type === 'IdentifierRef') {
    parseSemicolon(ctx);
    return {
      type: 'ProcedureCallStatement',
      procedure: ref.name,
      args: [],
      span: ctx.spanFrom(start),
    };
  }

  ctx.error(
    'PAR031',
    'Expected := or ( after reference in statement',
    spanOfToken(ctx.current()),
  );
  parseSemicolon(ctx);
  return { type: 'NullStatement', span: ctx.spanFrom(start) };
}

// ── Built-in Procedure Call ─────────────────────────────────────────

function parseBuiltinProcedureCall(ctx: ParserContext): StatementNode {
  const start = ctx.startPos();
  const name = ctx.consume().text.toUpperCase();

  let args: ExpressionNode[] = [];
  if (ctx.check('SYM_LPAREN')) {
    ctx.consume();
    args = parseCommaSeparatedList(
      ctx,
      (c) => parseExpression(c, 0),
      'SYM_RPAREN',
    );
    ctx.expect('SYM_RPAREN');
  }

  parseSemicolon(ctx);
  return {
    type: 'ProcedureCallStatement',
    procedure: name,
    args,
    span: ctx.spanFrom(start),
  };
}

// ── IF Statement ────────────────────────────────────────────────────

function parseIfStatement(ctx: ParserContext): StatementNode {
  const start = ctx.startPos();
  ctx.expect('KW_IF');

  const condition = parseExpression(ctx, 0);
  ctx.expect('KW_THEN');

  const thenBranch = parseStatementList(ctx, 'KW_ELSE', 'KW_END_IF');

  let elseBranch: StatementNode[] | undefined;
  if (ctx.skip('KW_ELSE')) {
    elseBranch = parseStatementList(ctx, 'KW_END_IF');
  }

  ctx.expect('KW_END_IF');
  parseSemicolon(ctx);

  return {
    type: 'IfStatement',
    condition,
    thenBranch,
    ...(elseBranch !== undefined ? { elseBranch } : {}),
    span: ctx.spanFrom(start),
  };
}

// ── CASE Statement ──────────────────────────────────────────────────

function parseCaseStatement(ctx: ParserContext): StatementNode {
  const start = ctx.startPos();
  ctx.expect('KW_CASE');

  const selector = parseExpression(ctx, 0);
  ctx.expect('KW_OF');

  const actions: CaseActionNode[] = [];
  while (
    !ctx.isEOF() &&
    !ctx.check('KW_OTHERWISE') &&
    !ctx.check('KW_END_CASE')
  ) {
    actions.push(parseCaseAction(ctx));
  }

  let otherwise: StatementNode[] | undefined;
  if (ctx.skip('KW_OTHERWISE')) {
    ctx.expect('SYM_COLON');
    otherwise = parseStatementList(ctx, 'KW_END_CASE');
  }

  ctx.expect('KW_END_CASE');
  parseSemicolon(ctx);

  return {
    type: 'CaseStatement',
    selector,
    actions: actions,
    ...(otherwise !== undefined ? { otherwise } : {}),
    span: ctx.spanFrom(start),
  };
}

function parseCaseAction(ctx: ParserContext): CaseActionNode {
  const start = ctx.startPos();

  const selectors: ExpressionNode[] = [parseExpression(ctx, 0)];
  while (ctx.skip('SYM_COMMA')) {
    selectors.push(parseExpression(ctx, 0));
  }
  ctx.expect('SYM_COLON');

  const statements = parseStatementList(
    ctx,
    'KW_OTHERWISE',
    'KW_END_CASE',
    'LIT_INTEGER',
    'LIT_REAL',
    'LIT_STRING',
    'IDENT',
    'BC_TRUE',
    'BC_FALSE',
  );

  if (statements.length === 0) {
    statements.push(parseStatement(ctx));
  }

  return {
    type: 'CaseAction',
    selectors,
    statements,
    span: ctx.spanFrom(start),
  };
}

// ── REPEAT Statement ────────────────────────────────────────────────

function parseRepeatStatement(ctx: ParserContext): StatementNode {
  const start = ctx.startPos();
  ctx.expect('KW_REPEAT');

  let control: RepeatControlNode | undefined;

  if (ctx.check('IDENT') && ctx.peek(1).kind === 'SYM_ASSIGN') {
    const controlStart = ctx.startPos();
    const variable = parseIdentifier(ctx);
    ctx.expect('SYM_ASSIGN');
    const initial = parseExpression(ctx, 0);
    ctx.expect('KW_TO');
    const final_ = parseExpression(ctx, 0);
    let increment: ExpressionNode | undefined;
    if (ctx.skip('KW_BY')) {
      increment = parseExpression(ctx, 0);
    }
    control = {
      type: 'RepeatControl',
      kind: 'FOR',
      variable,
      initial,
      final: final_,
      ...(increment !== undefined ? { increment } : {}),
      span: ctx.spanFrom(controlStart),
    };
  } else if (ctx.skip('KW_WHILE')) {
    const controlStart = ctx.startPos();
    const condition = parseExpression(ctx, 0);
    control = {
      type: 'RepeatControl',
      kind: 'WHILE',
      condition,
      span: ctx.spanFrom(controlStart),
    };
  } else if (ctx.skip('KW_UNTIL')) {
    const controlStart = ctx.startPos();
    const condition = parseExpression(ctx, 0);
    control = {
      type: 'RepeatControl',
      kind: 'UNTIL',
      condition,
      span: ctx.spanFrom(controlStart),
    };
  }

  if (control && control.kind === 'FOR') {
    if (ctx.check('KW_WHILE') || ctx.check('KW_UNTIL')) {
      ctx.warning(
        'PAR080',
        'Combined REPEAT controls (FOR+WHILE/UNTIL) are partially supported; only FOR control is preserved',
        spanOfToken(ctx.current()),
      );
      ctx.consume();
      parseExpression(ctx, 0);
    }
  }

  parseSemicolon(ctx);

  const statements = parseStatementList(ctx, 'KW_END_REPEAT');

  ctx.expect('KW_END_REPEAT');
  parseSemicolon(ctx);

  return {
    type: 'RepeatStatement',
    ...(control !== undefined ? { control } : {}),
    statements,
    span: ctx.spanFrom(start),
  };
}

// ── ALIAS Statement ─────────────────────────────────────────────────

function parseAliasStatement(ctx: ParserContext): StatementNode {
  const start = ctx.startPos();
  ctx.expect('KW_ALIAS');

  const variable = parseIdentifier(ctx);
  ctx.expect('KW_FOR');

  const base = parseQualifiers(ctx, parsePrimary(ctx));
  parseSemicolon(ctx);

  const statements = parseStatementList(ctx, 'KW_END_ALIAS');

  ctx.expect('KW_END_ALIAS');
  parseSemicolon(ctx);

  return {
    type: 'AliasStatement',
    variable,
    base,
    statements,
    span: ctx.spanFrom(start),
  };
}

// ── RETURN Statement ────────────────────────────────────────────────

function parseReturnStatement(ctx: ParserContext): StatementNode {
  const start = ctx.startPos();
  ctx.expect('KW_RETURN');

  let value: ExpressionNode | undefined;
  if (ctx.check('SYM_LPAREN')) {
    ctx.consume();
    value = parseExpression(ctx, 0);
    ctx.expect('SYM_RPAREN');
  }

  parseSemicolon(ctx);

  return {
    type: 'ReturnStatement',
    ...(value !== undefined ? { value } : {}),
    span: ctx.spanFrom(start),
  };
}

// ── Compound Statement ──────────────────────────────────────────────

function parseCompoundStatement(ctx: ParserContext): StatementNode {
  const start = ctx.startPos();
  ctx.expect('KW_BEGIN');

  const statements = parseStatementList(ctx, 'KW_END');

  ctx.expect('KW_END');
  parseSemicolon(ctx);

  return {
    type: 'CompoundStatement',
    statements,
    span: ctx.spanFrom(start),
  };
}
