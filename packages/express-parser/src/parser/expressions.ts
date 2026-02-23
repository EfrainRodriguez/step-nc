import type {
  AggregateElementNode,
  BinaryOperator,
  ExpressionNode,
  QualifierNode,
  UnaryOperator,
} from '../ast/expressions';
import type { TokenKind } from '../lexer/types';
import {
  errorExpression,
  isBuiltinFunction,
  parseCommaSeparatedList,
  parseIdentifier,
} from './common';
import { ParserContext } from './context';
import { spanBetween, spanOfToken } from './types';

// ── Precedence Table ────────────────────────────────────────────────

interface BinaryOpInfo {
  prec: number;
  assoc: 'left' | 'right' | 'none';
  op: BinaryOperator;
}

const BINARY_OPS: ReadonlyMap<TokenKind, BinaryOpInfo> = new Map<
  TokenKind,
  BinaryOpInfo
>([
  // Level 1 — Comparison (non-associative)
  ['SYM_EQUAL', { prec: 1, assoc: 'none', op: '=' }],
  ['SYM_NOT_EQUAL', { prec: 1, assoc: 'none', op: '<>' }],
  ['SYM_LESS', { prec: 1, assoc: 'none', op: '<' }],
  ['SYM_GREATER', { prec: 1, assoc: 'none', op: '>' }],
  ['SYM_LESS_EQUAL', { prec: 1, assoc: 'none', op: '<=' }],
  ['SYM_GREATER_EQUAL', { prec: 1, assoc: 'none', op: '>=' }],
  ['SYM_ASSIGN_EXT', { prec: 1, assoc: 'none', op: ':=:' }],
  ['SYM_NOT_EQUAL_EXT', { prec: 1, assoc: 'none', op: ':<>:' }],
  ['OP_IN', { prec: 1, assoc: 'none', op: 'IN' }],
  ['OP_LIKE', { prec: 1, assoc: 'none', op: 'LIKE' }],

  // Level 2 — Addition / OR (left-associative)
  ['SYM_PLUS', { prec: 2, assoc: 'left', op: '+' }],
  ['SYM_MINUS', { prec: 2, assoc: 'left', op: '-' }],
  ['OP_OR', { prec: 2, assoc: 'left', op: 'OR' }],
  ['OP_XOR', { prec: 2, assoc: 'left', op: 'XOR' }],
  ['OP_ANDOR', { prec: 2, assoc: 'left', op: 'ANDOR' }],

  // Level 3 — Multiplication / AND (left-associative)
  ['SYM_STAR', { prec: 3, assoc: 'left', op: '*' }],
  ['SYM_SLASH', { prec: 3, assoc: 'left', op: '/' }],
  ['OP_DIV', { prec: 3, assoc: 'left', op: 'DIV' }],
  ['OP_MOD', { prec: 3, assoc: 'left', op: 'MOD' }],
  ['OP_AND', { prec: 3, assoc: 'left', op: 'AND' }],
  ['SYM_OR_OR', { prec: 3, assoc: 'left', op: '||' }],

  // Level 4 — Exponentiation (right-associative)
  ['SYM_EXPONENT', { prec: 4, assoc: 'right', op: '**' }],
]);

// ── Public API ──────────────────────────────────────────────────────

export function parseExpression(
  ctx: ParserContext,
  minPrec = 0,
): ExpressionNode {
  let left = parseUnary(ctx);

  for (;;) {
    const token = ctx.current();
    const opInfo = BINARY_OPS.get(token.kind);
    if (!opInfo || opInfo.prec < minPrec) break;

    ctx.consume();

    const nextMinPrec =
      opInfo.assoc === 'right' ? opInfo.prec : opInfo.prec + 1;
    const right = parseExpression(ctx, nextMinPrec);

    left = {
      type: 'BinaryExpression',
      operator: opInfo.op,
      left,
      right,
      span: spanBetween(left.span.start, right.span.end),
    };
  }

  return left;
}

// ── Unary ───────────────────────────────────────────────────────────

export function parseUnary(ctx: ParserContext): ExpressionNode {
  const token = ctx.current();

  if (token.kind === 'OP_NOT') {
    const start = ctx.startPos();
    ctx.consume();
    const operand = parseUnary(ctx);
    return {
      type: 'UnaryExpression',
      operator: 'NOT' as UnaryOperator,
      operand,
      span: spanBetween(start, operand.span.end),
    };
  }

  if (token.kind === 'SYM_PLUS' || token.kind === 'SYM_MINUS') {
    const start = ctx.startPos();
    const op: UnaryOperator = token.kind === 'SYM_PLUS' ? '+' : '-';
    ctx.consume();
    const operand = parseUnary(ctx);
    return {
      type: 'UnaryExpression',
      operator: op,
      operand,
      span: spanBetween(start, operand.span.end),
    };
  }

  return parsePrimary(ctx);
}

// ── Primary ─────────────────────────────────────────────────────────

export function parsePrimary(ctx: ParserContext): ExpressionNode {
  const token = ctx.current();

  switch (token.kind) {
    // Literals
    case 'LIT_INTEGER': {
      ctx.consume();
      return {
        type: 'IntegerLiteral',
        value: parseInt(token.text, 10),
        span: spanOfToken(token),
      };
    }
    case 'LIT_REAL': {
      ctx.consume();
      return {
        type: 'RealLiteral',
        value: parseFloat(token.text),
        span: spanOfToken(token),
      };
    }
    case 'LIT_STRING': {
      ctx.consume();
      // Strip surrounding quotes
      const raw = token.text;
      const value = raw.length >= 2 ? raw.slice(1, -1) : raw;
      return { type: 'StringLiteral', value, span: spanOfToken(token) };
    }
    case 'LIT_BINARY': {
      ctx.consume();
      return {
        type: 'BinaryLiteral',
        value: token.text,
        span: spanOfToken(token),
      };
    }

    // Logical literals
    case 'BC_TRUE':
      ctx.consume();
      return {
        type: 'LogicalLiteral',
        value: 'TRUE',
        span: spanOfToken(token),
      };
    case 'BC_FALSE':
      ctx.consume();
      return {
        type: 'LogicalLiteral',
        value: 'FALSE',
        span: spanOfToken(token),
      };
    case 'BC_UNKNOWN':
      ctx.consume();
      return {
        type: 'LogicalLiteral',
        value: 'UNKNOWN',
        span: spanOfToken(token),
      };

    // Built-in constants
    case 'BC_QUESTION_MARK':
      ctx.consume();
      return { type: 'IndeterminateLiteral', span: spanOfToken(token) };
    case 'BC_SELF': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const start = ctx.startPos();
      ctx.consume();
      const selfNode: ExpressionNode = {
        type: 'SelfRef',
        span: spanOfToken(token),
      };
      return parseQualifiers(ctx, selfNode);
    }
    case 'BC_CONST_E':
      ctx.consume();
      return {
        type: 'IdentifierRef',
        name: 'CONST_E',
        span: spanOfToken(token),
      };
    case 'BC_PI':
      ctx.consume();
      return { type: 'IdentifierRef', name: 'PI', span: spanOfToken(token) };

    // Parenthesized expression
    case 'SYM_LPAREN': {
      ctx.consume();
      const expr = parseExpression(ctx, 0);
      ctx.expect('SYM_RPAREN');
      return expr;
    }

    // QUERY expression
    case 'KW_QUERY':
      return parseQueryExpression(ctx);

    // Aggregate initializer
    case 'SYM_LBRACKET':
      return parseAggregateInitializer(ctx);

    // Interval expression
    case 'SYM_LBRACE':
      return parseIntervalExpression(ctx);

    // Identifier (variable, function, type...) — also allow keywords used as names in expressions
    case 'IDENT':
    case 'KW_ENTITY':
    case 'KW_TYPE':
    case 'KW_LIST':
    case 'KW_ARRAY':
    case 'KW_BAG':
    case 'KW_SET':
      return parseIdentifierRefOrCall(ctx);

    // Built-in functions
    default:
      if (isBuiltinFunction(token.kind)) {
        return parseBuiltinFunctionCall(ctx);
      }

      ctx.error(
        'PAR010',
        `Expected expression, found '${token.kind}'`,
        spanOfToken(token),
      );
      return errorExpression(ctx);
  }
}

// ── Identifier → Ref or FunctionCall ────────────────────────────────

export function parseIdentifierRefOrCall(ctx: ParserContext): ExpressionNode {
  const token = ctx.current();
  const start = ctx.startPos();
  const name = ctx.consume().text;

  if (ctx.check('SYM_LPAREN')) {
    ctx.consume();
    const args = parseCommaSeparatedList(
      ctx,
      (c) => parseExpression(c, 0),
      'SYM_RPAREN',
    );
    ctx.expect('SYM_RPAREN');
    const callNode: ExpressionNode = {
      type: 'FunctionCallExpression',
      name,
      args,
      span: ctx.spanFrom(start),
    };
    return parseQualifiers(ctx, callNode);
  }

  const ref: ExpressionNode = {
    type: 'IdentifierRef',
    name,
    span: spanOfToken(token),
  };
  return parseQualifiers(ctx, ref);
}

// ── Qualifiers (.attr, \group, [index]) ─────────────────────────────

/** Parse a name (IDENT or keyword used as entity/type name in qualifiers). */
function parseNameInQualifier(ctx: ParserContext): string {
  const token = ctx.current();
  const nameKinds = [
    'IDENT',
    'KW_ENTITY',
    'KW_TYPE',
    'KW_LIST',
    'KW_ARRAY',
    'KW_BAG',
    'KW_SET',
  ];
  if (
    nameKinds.includes(token.kind) ||
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

export function parseQualifiers(
  ctx: ParserContext,
  root: ExpressionNode,
): ExpressionNode {
  const qualifiers: QualifierNode[] = [];

  for (;;) {
    const token = ctx.current();

    if (token.kind === 'SYM_DOT') {
      const qStart = ctx.startPos();
      ctx.consume();
      const name = parseNameInQualifier(ctx);
      qualifiers.push({
        type: 'AttributeRef',
        name,
        span: ctx.spanFrom(qStart),
      });
    } else if (token.kind === 'SYM_BACKSLASH') {
      const qStart = ctx.startPos();
      ctx.consume();
      const name = parseNameInQualifier(ctx);
      qualifiers.push({
        type: 'GroupRef',
        name,
        span: ctx.spanFrom(qStart),
      });
    } else if (token.kind === 'SYM_LBRACKET') {
      const qStart = ctx.startPos();
      ctx.consume();
      const index = parseExpression(ctx, 0);
      let upperIndex: ExpressionNode | undefined;
      if (ctx.skip('SYM_COLON')) {
        upperIndex = parseExpression(ctx, 0);
      }
      ctx.expect('SYM_RBRACKET');
      qualifiers.push({
        type: 'IndexRef',
        index,
        ...(upperIndex !== undefined ? { upperIndex } : {}),
        span: ctx.spanFrom(qStart),
      });
    } else {
      break;
    }
  }

  if (qualifiers.length === 0) return root;

  const lastQ = qualifiers[qualifiers.length - 1]!;
  return {
    type: 'QualifiedRef',
    root,
    qualifiers,
    span: spanBetween(root.span.start, lastQ.span.end),
  };
}

// ── QUERY Expression ────────────────────────────────────────────────

function parseQueryExpression(ctx: ParserContext): ExpressionNode {
  const start = ctx.startPos();
  ctx.expect('KW_QUERY');
  ctx.expect('SYM_LPAREN');
  const variable = parseIdentifier(ctx);
  ctx.expect('SYM_SUBTYPE_MARK'); // <*
  const source = parseExpression(ctx, 0);
  ctx.expect('SYM_PIPE'); // |
  const condition = parseExpression(ctx, 0);
  ctx.expect('SYM_RPAREN');
  return {
    type: 'QueryExpression',
    variable,
    source,
    condition,
    span: ctx.spanFrom(start),
  };
}

// ── Aggregate Initializer ───────────────────────────────────────────

function parseAggregateInitializer(ctx: ParserContext): ExpressionNode {
  const start = ctx.startPos();
  ctx.expect('SYM_LBRACKET');

  const elements: AggregateElementNode[] = [];
  if (!ctx.check('SYM_RBRACKET')) {
    const elems = parseCommaSeparatedList(
      ctx,
      parseAggregateElement,
      'SYM_RBRACKET',
    );
    elements.push(...elems);
  }

  ctx.expect('SYM_RBRACKET');
  return {
    type: 'AggregateInitializer',
    elements: elements,
    span: ctx.spanFrom(start),
  };
}

function parseAggregateElement(ctx: ParserContext) {
  const start = ctx.startPos();
  const value = parseExpression(ctx, 0);
  let repetition: ExpressionNode | undefined;
  if (ctx.skip('SYM_COLON')) {
    repetition = parseExpression(ctx, 0);
  }
  return {
    type: 'AggregateElement' as const,
    value,
    ...(repetition !== undefined ? { repetition } : {}),
    span: ctx.spanFrom(start),
  };
}

// ── Interval Expression ─────────────────────────────────────────────

function parseIntervalExpression(ctx: ParserContext): ExpressionNode {
  const start = ctx.startPos();
  ctx.expect('SYM_LBRACE');

  // Use minPrec 2 so we parse one term only (stop before comparison ops at prec 1)
  const low = parseExpression(ctx, 2);
  const lowOp = parseIntervalOp(ctx);
  const value = parseExpression(ctx, 2);
  const highOp = parseIntervalOp(ctx);
  const high = parseExpression(ctx, 2);

  ctx.expect('SYM_RBRACE');
  return {
    type: 'IntervalExpression',
    low,
    lowOp,
    value,
    highOp,
    high,
    span: ctx.spanFrom(start),
  };
}

function parseIntervalOp(ctx: ParserContext): '<' | '<=' {
  if (ctx.skip('SYM_LESS_EQUAL')) return '<=';
  // Lexer may emit SYM_LESS + SYM_EQUAL when there is space between < and =
  if (ctx.check('SYM_LESS') && ctx.peek(1).kind === 'SYM_EQUAL') {
    ctx.consume();
    ctx.consume();
    return '<=';
  }
  ctx.expect('SYM_LESS');
  return '<';
}

// ── Built-in Function Call ──────────────────────────────────────────

function parseBuiltinFunctionCall(ctx: ParserContext): ExpressionNode {
  const start = ctx.startPos();
  const token = ctx.consume();
  const name = token.text.toUpperCase();

  ctx.expect('SYM_LPAREN');
  const args = parseCommaSeparatedList(
    ctx,
    (c) => parseExpression(c, 0),
    'SYM_RPAREN',
  );
  ctx.expect('SYM_RPAREN');

  const callNode: ExpressionNode = {
    type: 'FunctionCallExpression',
    name,
    args,
    span: ctx.spanFrom(start),
  };
  return parseQualifiers(ctx, callNode);
}
