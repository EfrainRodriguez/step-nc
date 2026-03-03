import type {
  ConstantDeclarationNode,
  ConstantValueDeclarationNode,
  DeclarationNode,
  DerivedAttributeNode,
  EntityDeclarationNode,
  ExplicitAttributeNode,
  FunctionDeclarationNode,
  InverseAttributeNode,
  LocalVariableNode,
  ParameterNode,
  ProcedureDeclarationNode,
  RuleDeclarationNode,
  SubtypeConstraintDeclarationNode,
  SubtypeOfNode,
  SupertypeConstraintNode,
  SupertypeExpressionNode,
  TypeDeclarationNode,
  UniqueRuleNode,
  WhereRuleNode,
} from '../ast/declarations';
import type {
  BinaryExpressionNode,
  ExpressionNode,
  QualifiedRefNode,
} from '../ast/expressions';
import type { TypeNode } from '../ast/types';
import type { TokenKind } from '../lexer/types';
import {
  isEndKeyword,
  isStartOfDeclaration,
  parseCommaSeparatedList,
  parseIdentifier,
  parseIdentifierOrBuiltin,
  parseSemicolon,
  SYNC_DECLARATION,
  synchronize,
} from './common';
import { ParserContext } from './context';
import { parseExpression, parsePrimary } from './expressions';
import { parseStatementList } from './statements';
import { parseType, spanOfToken } from './types';

// ── Entity Section Helpers ──────────────────────────────────────────

function isEntitySection(kind: TokenKind): boolean {
  return (
    kind === 'KW_DERIVE' ||
    kind === 'KW_INVERSE' ||
    kind === 'KW_UNIQUE' ||
    kind === 'KW_WHERE' ||
    kind === 'KW_END_ENTITY'
  );
}

// ── Public: Declaration Dispatcher ──────────────────────────────────

export function parseDeclaration(ctx: ParserContext): DeclarationNode {
  const token = ctx.current();

  switch (token.kind) {
    case 'KW_ENTITY':
      return parseEntityDeclaration(ctx);
    case 'KW_TYPE':
      return parseTypeDeclaration(ctx);
    case 'KW_FUNCTION':
      return parseFunctionDeclaration(ctx);
    case 'KW_PROCEDURE':
      return parseProcedureDeclaration(ctx);
    case 'KW_RULE':
      return parseRuleDeclaration(ctx);
    case 'KW_SUBTYPE_CONSTRAINT':
      return parseSubtypeConstraintDeclaration(ctx);
    case 'KW_CONSTANT':
      return parseConstantDeclaration(ctx);
    default:
      ctx.error(
        'PAR040',
        `Expected declaration, found '${token.kind}'`,
        spanOfToken(token),
      );
      synchronize(ctx, SYNC_DECLARATION);
      return {
        type: 'TypeDeclaration',
        name: '<error>',
        underlyingType: {
          type: 'NamedType',
          name: '<error>',
          span: spanOfToken(token),
        },
        span: spanOfToken(token),
      };
  }
}

// ── Entity Declaration ──────────────────────────────────────────────

function parseEntityDeclaration(ctx: ParserContext): EntityDeclarationNode {
  const start = ctx.startPos();
  ctx.expect('KW_ENTITY');
  const name = parseIdentifierOrBuiltin(ctx);

  let abstract: boolean | undefined;
  if (ctx.skip('KW_ABSTRACT')) {
    abstract = true;
  }

  let supertypeConstraint: SupertypeConstraintNode | undefined;
  if (ctx.check('KW_SUPERTYPE')) {
    supertypeConstraint = parseSupertypeConstraint(ctx, !abstract);
  }
  // Consume semicolon after SUPERTYPE only when SUBTYPE OF follows (e.g. "ABSTRACT SUPERTYPE; SUBTYPE OF (bar);")
  if (
    supertypeConstraint &&
    ctx.check('SYM_SEMICOLON') &&
    ctx.peek(1).kind === 'KW_SUBTYPE'
  ) {
    parseSemicolon(ctx);
  }

  let subtypeOf: SubtypeOfNode | undefined;
  if (ctx.skip('KW_SUBTYPE')) {
    const stStart = ctx.startPos();
    ctx.expect('KW_OF');
    ctx.expect('SYM_LPAREN');
    const entities = parseCommaSeparatedList(
      ctx,
      parseIdentifier,
      'SYM_RPAREN',
    );
    ctx.expect('SYM_RPAREN');
    subtypeOf = { type: 'SubtypeOf', entities, span: ctx.spanFrom(stStart) };
  }

  parseSemicolon(ctx);

  // Exit at loop body start when we see a section keyword or EOF, so that
  // error recovery that does not advance the cursor cannot cause infinite loops.
  // Configurable limits with PAR090/PAR091 protect against malformed or huge input.
  const attributes: ExplicitAttributeNode[] = [];
  const maxExplicitAttributes = ctx.getMaxExplicitAttributes();
  while (
    !ctx.isEOF() &&
    !isEntitySection(ctx.current().kind) &&
    attributes.length < maxExplicitAttributes
  ) {
    if (isEntitySection(ctx.current().kind) || ctx.isEOF()) break;
    const posBefore = ctx.position();
    attributes.push(...parseExplicitAttribute(ctx));
    if (attributes.length >= maxExplicitAttributes) {
      ctx.error(
        'PAR090',
        'Too many explicit attributes in entity',
        spanOfToken(ctx.current()),
      );
      break;
    }
    if (ctx.position() === posBefore && !ctx.isEOF()) {
      ctx.consume();
    }
  }

  const maxEntitySectionItems = ctx.getMaxEntitySectionItems();
  let derivedAttributes: DerivedAttributeNode[] | undefined;
  if (ctx.skip('KW_DERIVE')) {
    derivedAttributes = [];
    while (
      !ctx.isEOF() &&
      !isEntitySection(ctx.current().kind) &&
      derivedAttributes.length < maxEntitySectionItems
    ) {
      if (isEntitySection(ctx.current().kind) || ctx.isEOF()) break;
      const posBefore = ctx.position();
      derivedAttributes.push(parseDerivedAttribute(ctx));
      if (ctx.position() === posBefore && !ctx.isEOF()) {
        ctx.consume();
      }
      if (derivedAttributes.length >= maxEntitySectionItems) {
        ctx.error(
          'PAR091',
          'Too many section items (DERIVE/INVERSE) in entity',
          spanOfToken(ctx.current()),
        );
        break;
      }
    }
  }

  let inverseAttributes: InverseAttributeNode[] | undefined;
  if (ctx.skip('KW_INVERSE')) {
    inverseAttributes = [];
    while (
      !ctx.isEOF() &&
      !isEntitySection(ctx.current().kind) &&
      inverseAttributes.length < maxEntitySectionItems
    ) {
      if (isEntitySection(ctx.current().kind) || ctx.isEOF()) break;
      inverseAttributes.push(parseInverseAttribute(ctx));
      if (inverseAttributes.length >= maxEntitySectionItems) {
        ctx.error(
          'PAR091',
          'Too many section items (DERIVE/INVERSE) in entity',
          spanOfToken(ctx.current()),
        );
        break;
      }
    }
  }

  let uniqueRules: UniqueRuleNode[] | undefined;
  if (ctx.skip('KW_UNIQUE')) {
    uniqueRules = parseUniqueClause(ctx);
  }

  let whereRules: WhereRuleNode[] | undefined;
  if (ctx.skip('KW_WHERE')) {
    whereRules = parseWhereClause(ctx);
  }

  ctx.expect('KW_END_ENTITY');
  parseSemicolon(ctx);

  return {
    type: 'EntityDeclaration',
    name,
    ...(abstract ? { abstract } : {}),
    ...(supertypeConstraint ? { supertypeConstraint } : {}),
    ...(subtypeOf ? { subtypeOf } : {}),
    attributes,
    ...(derivedAttributes ? { derivedAttributes } : {}),
    ...(inverseAttributes ? { inverseAttributes } : {}),
    ...(uniqueRules ? { uniqueRules } : {}),
    ...(whereRules ? { whereRules } : {}),
    span: ctx.spanFrom(start),
  };
}

// ── Supertype Constraint ────────────────────────────────────────────

function parseSupertypeConstraint(
  ctx: ParserContext,
  ofRequired: boolean,
): SupertypeConstraintNode {
  const start = ctx.startPos();
  ctx.expect('KW_SUPERTYPE');

  let expression: SupertypeExpressionNode | undefined;
  if (ofRequired || ctx.check('KW_OF')) {
    ctx.expect('KW_OF');
    ctx.expect('SYM_LPAREN');
    expression = parseSupertypeExpression(ctx);
    ctx.expect('SYM_RPAREN');
  }

  return {
    type: 'SupertypeConstraint',
    ...(expression ? { expression } : {}),
    span: ctx.spanFrom(start),
  };
}

export function parseSupertypeExpression(
  ctx: ParserContext,
): SupertypeExpressionNode {
  const start = ctx.startPos();
  let expr = parseSupertypeExprFactor(ctx);

  while (ctx.skip('OP_ANDOR')) {
    const right = parseSupertypeExprFactor(ctx);
    expr = {
      type: 'BinaryExpression',
      operator: 'ANDOR',
      left: expr,
      right,
      span: { start: expr.span.start, end: right.span.end },
    } as BinaryExpressionNode;
  }

  return {
    type: 'SupertypeExpression',
    expression: expr,
    span: ctx.spanFrom(start),
  };
}

function parseSupertypeExprFactor(ctx: ParserContext): ExpressionNode {
  let left = parseSupertypeExprTerm(ctx);

  while (ctx.skip('OP_AND')) {
    const right = parseSupertypeExprTerm(ctx);
    left = {
      type: 'BinaryExpression',
      operator: 'AND',
      left,
      right,
      span: { start: left.span.start, end: right.span.end },
    };
  }

  return left;
}

function parseSupertypeExprTerm(ctx: ParserContext): ExpressionNode {
  if (ctx.check('KW_ONEOF')) {
    return parseOneOf(ctx);
  }

  if (ctx.check('SYM_LPAREN')) {
    ctx.consume();
    const inner = parseSupertypeExpression(ctx);
    ctx.expect('SYM_RPAREN');
    return inner.expression;
  }

  const start = ctx.startPos();
  const name = parseIdentifier(ctx);
  return { type: 'IdentifierRef', name, span: ctx.spanFrom(start) };
}

function parseOneOf(ctx: ParserContext): ExpressionNode {
  const start = ctx.startPos();
  ctx.expect('KW_ONEOF');
  ctx.expect('SYM_LPAREN');
  const args = parseCommaSeparatedList(
    ctx,
    (c) => {
      const inner = parseSupertypeExpression(c);
      return inner.expression;
    },
    'SYM_RPAREN',
  );
  ctx.expect('SYM_RPAREN');
  return {
    type: 'FunctionCallExpression',
    name: 'ONEOF',
    args,
    span: ctx.spanFrom(start),
  };
}

// ── Explicit Attributes ─────────────────────────────────────────────

function parseExplicitAttribute(ctx: ParserContext): ExplicitAttributeNode[] {
  const start = ctx.startPos();
  const optionalBeforeNames = ctx.skip('KW_OPTIONAL') || undefined;
  const names = [parseIdentifier(ctx)];
  while (ctx.skip('SYM_COMMA')) {
    names.push(parseIdentifier(ctx));
  }
  ctx.expect('SYM_COLON');

  const optionalBeforeType = ctx.skip('KW_OPTIONAL') || undefined;
  const attributeType = parseType(ctx);
  parseSemicolon(ctx);

  const optional = optionalBeforeNames ?? optionalBeforeType;
  return [
    {
      type: 'ExplicitAttribute',
      names,
      ...(optional ? { optional } : {}),
      attributeType,
      span: ctx.spanFrom(start),
    },
  ];
}

// ── Derived Attributes ──────────────────────────────────────────────

function parseDerivedAttribute(ctx: ParserContext): DerivedAttributeNode {
  const start = ctx.startPos();

  let name: string;
  let redeclaredAttr: QualifiedRefNode | undefined;

  if (ctx.current().kind === 'BC_SELF') {
    const expr = parsePrimary(ctx);
    if (expr.type === 'QualifiedRef') {
      redeclaredAttr = expr;
      const lastQ = expr.qualifiers[expr.qualifiers.length - 1];
      name = lastQ && lastQ.type === 'AttributeRef' ? lastQ.name : '<error>';
    } else {
      name = '<error>';
    }
  } else {
    name = parseIdentifier(ctx);
  }

  ctx.expect('SYM_COLON');
  const attributeType = parseType(ctx);
  ctx.expect('SYM_ASSIGN');
  const expression = parseExpression(ctx, 0);
  parseSemicolon(ctx);

  return {
    type: 'DerivedAttribute',
    name,
    ...(redeclaredAttr ? { redeclaredAttr } : {}),
    attributeType,
    expression,
    span: ctx.spanFrom(start),
  };
}

// ── Inverse Attributes ──────────────────────────────────────────────

function parseInverseAttribute(ctx: ParserContext): InverseAttributeNode {
  const start = ctx.startPos();
  const name = parseIdentifier(ctx);
  ctx.expect('SYM_COLON');

  let attributeType: TypeNode;
  if (
    ctx.check('KW_SET') ||
    ctx.check('KW_BAG') ||
    ctx.check('KW_LIST') ||
    ctx.check('KW_ARRAY')
  ) {
    attributeType = parseType(ctx);
  } else {
    attributeType = parseType(ctx);
  }

  ctx.expect('KW_FOR');
  const invertedAttribute = parseIdentifier(ctx);
  parseSemicolon(ctx);

  let invertedEntity = '<error>';
  if (attributeType.type === 'NamedType') {
    invertedEntity = attributeType.name;
  } else if (
    attributeType.type === 'AggregationType' &&
    attributeType.baseType.type === 'NamedType'
  ) {
    invertedEntity = attributeType.baseType.name;
  }

  return {
    type: 'InverseAttribute',
    name,
    attributeType,
    invertedEntity,
    invertedAttribute,
    span: ctx.spanFrom(start),
  };
}

// ── WHERE Clause ────────────────────────────────────────────────────

export function parseWhereClause(ctx: ParserContext): WhereRuleNode[] {
  const rules: WhereRuleNode[] = [];
  while (
    !ctx.isEOF() &&
    !isEndKeyword(ctx.current().kind) &&
    !isStartOfDeclaration(ctx.current().kind)
  ) {
    const start = ctx.startPos();
    ctx.skip('KW_WHERE');
    let label: string | undefined;

    if (ctx.check('IDENT') && ctx.peek(1).kind === 'SYM_COLON') {
      label = ctx.consume().text;
      ctx.consume();
    }

    const expression = parseExpression(ctx, 0);
    parseSemicolon(ctx);
    rules.push({
      type: 'WhereRule',
      ...(label !== undefined ? { label } : {}),
      expression,
      span: ctx.spanFrom(start),
    });
  }
  return rules;
}

// ── UNIQUE Clause ───────────────────────────────────────────────────

function parseUniqueClause(ctx: ParserContext): UniqueRuleNode[] {
  const rules: UniqueRuleNode[] = [];
  while (
    !ctx.isEOF() &&
    !isEndKeyword(ctx.current().kind) &&
    ctx.current().kind !== 'KW_WHERE'
  ) {
    const start = ctx.startPos();
    let label: string | undefined;

    if (ctx.check('IDENT') && ctx.peek(1).kind === 'SYM_COLON') {
      label = ctx.consume().text;
      ctx.consume();
    }

    const attributes = [parseIdentifier(ctx)];
    while (ctx.skip('SYM_COMMA')) {
      attributes.push(parseIdentifier(ctx));
    }
    parseSemicolon(ctx);

    rules.push({
      type: 'UniqueRule',
      ...(label !== undefined ? { label } : {}),
      attributes,
      span: ctx.spanFrom(start),
    });
  }
  return rules;
}

// ── Parameter List ──────────────────────────────────────────────────

export function parseParameterList(ctx: ParserContext): ParameterNode[] {
  ctx.expect('SYM_LPAREN');
  const params: ParameterNode[] = [];

  if (!ctx.check('SYM_RPAREN')) {
    do {
      const start = ctx.startPos();
      const isVar = ctx.skip('KW_VAR') || undefined;
      const names = [parseIdentifier(ctx)];
      while (ctx.skip('SYM_COMMA')) {
        names.push(parseIdentifier(ctx));
      }
      ctx.expect('SYM_COLON');
      const parameterType = parseType(ctx);
      params.push({
        type: 'Parameter',
        names,
        parameterType,
        ...(isVar ? { isVar } : {}),
        span: ctx.spanFrom(start),
      });
    } while (ctx.skip('SYM_SEMICOLON') && !ctx.check('SYM_RPAREN'));
  }

  ctx.expect('SYM_RPAREN');
  return params;
}

// ── Local Declarations ──────────────────────────────────────────────

function parseLocalDeclarations(ctx: ParserContext): LocalVariableNode[] {
  const locals: LocalVariableNode[] = [];
  ctx.expect('KW_LOCAL');

  while (!ctx.isEOF() && !ctx.check('KW_END_LOCAL')) {
    const start = ctx.startPos();
    const names = [parseIdentifier(ctx)];
    while (ctx.skip('SYM_COMMA')) {
      names.push(parseIdentifier(ctx));
    }
    ctx.expect('SYM_COLON');
    const variableType = parseType(ctx);

    let initialValue: ExpressionNode | undefined;
    if (ctx.skip('SYM_ASSIGN')) {
      initialValue = parseExpression(ctx, 0);
    }
    parseSemicolon(ctx);

    for (const name of names) {
      locals.push({
        type: 'LocalVariable',
        name,
        variableType,
        ...(initialValue !== undefined ? { initialValue } : {}),
        span: ctx.spanFrom(start),
      });
    }
  }

  ctx.expect('KW_END_LOCAL');
  parseSemicolon(ctx);
  return locals;
}

// ── Internal Declarations (TYPE, CONSTANT, LOCAL inside bodies) ─────

function parseInternalDeclarations(
  ctx: ParserContext,
): (TypeDeclarationNode | ConstantDeclarationNode | LocalVariableNode)[] {
  const decls: (
    | TypeDeclarationNode
    | ConstantDeclarationNode
    | LocalVariableNode
  )[] = [];

  while (!ctx.isEOF()) {
    if (ctx.check('KW_TYPE')) {
      decls.push(parseTypeDeclaration(ctx));
    } else if (ctx.check('KW_CONSTANT')) {
      decls.push(parseConstantDeclaration(ctx));
    } else if (ctx.check('KW_LOCAL')) {
      decls.push(...parseLocalDeclarations(ctx));
    } else {
      break;
    }
  }

  return decls;
}

// ── Type Declaration ────────────────────────────────────────────────

function parseTypeDeclaration(ctx: ParserContext): TypeDeclarationNode {
  const start = ctx.startPos();
  ctx.expect('KW_TYPE');
  const name = parseIdentifierOrBuiltin(ctx);
  ctx.expect('SYM_EQUAL');
  const underlyingType = parseType(ctx);
  parseSemicolon(ctx);

  let whereRules: WhereRuleNode[] | undefined;
  if (ctx.skip('KW_WHERE')) {
    whereRules = parseWhereClause(ctx);
  }

  ctx.expect('KW_END_TYPE');
  parseSemicolon(ctx);

  return {
    type: 'TypeDeclaration',
    name,
    underlyingType,
    ...(whereRules ? { whereRules } : {}),
    span: ctx.spanFrom(start),
  };
}

// ── Function Declaration ────────────────────────────────────────────

function parseFunctionDeclaration(ctx: ParserContext): FunctionDeclarationNode {
  const start = ctx.startPos();
  ctx.expect('KW_FUNCTION');
  const name = parseIdentifier(ctx);
  const parameters = parseParameterList(ctx);
  ctx.expect('SYM_COLON');
  const returnType = parseType(ctx);
  parseSemicolon(ctx);

  const declarations = parseInternalDeclarations(ctx);
  const body = parseStatementList(ctx, 'KW_END_FUNCTION');

  ctx.expect('KW_END_FUNCTION');
  parseSemicolon(ctx);

  return {
    type: 'FunctionDeclaration',
    name,
    parameters,
    returnType,
    ...(declarations.length > 0 ? { declarations } : {}),
    body,
    span: ctx.spanFrom(start),
  };
}

// ── Procedure Declaration ───────────────────────────────────────────

function parseProcedureDeclaration(
  ctx: ParserContext,
): ProcedureDeclarationNode {
  const start = ctx.startPos();
  ctx.expect('KW_PROCEDURE');
  const name = parseIdentifier(ctx);

  let parameters: ParameterNode[] = [];
  if (ctx.check('SYM_LPAREN')) {
    parameters = parseParameterList(ctx);
  }
  parseSemicolon(ctx);

  const declarations = parseInternalDeclarations(ctx);
  const body = parseStatementList(ctx, 'KW_END_PROCEDURE');

  ctx.expect('KW_END_PROCEDURE');
  parseSemicolon(ctx);

  return {
    type: 'ProcedureDeclaration',
    name,
    parameters,
    ...(declarations.length > 0 ? { declarations } : {}),
    body,
    span: ctx.spanFrom(start),
  };
}

// ── Rule Declaration ────────────────────────────────────────────────

function parseRuleDeclaration(ctx: ParserContext): RuleDeclarationNode {
  const start = ctx.startPos();
  ctx.expect('KW_RULE');
  const name = parseIdentifier(ctx);
  ctx.expect('KW_FOR');
  ctx.expect('SYM_LPAREN');
  const entities = parseCommaSeparatedList(ctx, parseIdentifier, 'SYM_RPAREN');
  ctx.expect('SYM_RPAREN');
  parseSemicolon(ctx);

  const declarations = parseInternalDeclarations(ctx);
  const body = parseStatementList(ctx, 'KW_WHERE', 'KW_END_RULE');

  let whereRules: WhereRuleNode[] | undefined;
  if (ctx.skip('KW_WHERE')) {
    whereRules = parseWhereClause(ctx);
  }

  ctx.expect('KW_END_RULE');
  parseSemicolon(ctx);

  return {
    type: 'RuleDeclaration',
    name,
    entities,
    ...(declarations.length > 0 ? { declarations } : {}),
    body,
    ...(whereRules ? { whereRules } : {}),
    span: ctx.spanFrom(start),
  };
}

// ── Subtype Constraint Declaration ──────────────────────────────────

function parseSubtypeConstraintDeclaration(
  ctx: ParserContext,
): SubtypeConstraintDeclarationNode {
  const start = ctx.startPos();
  ctx.expect('KW_SUBTYPE_CONSTRAINT');
  const name = parseIdentifier(ctx);
  ctx.expect('KW_FOR');
  const entity = parseIdentifier(ctx);
  parseSemicolon(ctx);

  let abstractSupertype: boolean | undefined;
  if (ctx.check('KW_ABSTRACT')) {
    ctx.consume();
    ctx.expect('KW_SUPERTYPE');
    parseSemicolon(ctx);
    abstractSupertype = true;
  }

  let totalOver: string[] | undefined;
  if (ctx.check('KW_TOTAL_OVER')) {
    ctx.consume();
    ctx.expect('SYM_LPAREN');
    totalOver = parseCommaSeparatedList(ctx, parseIdentifier, 'SYM_RPAREN');
    ctx.expect('SYM_RPAREN');
    parseSemicolon(ctx);
  }

  let supertypeExpression: SupertypeExpressionNode | undefined;
  if (!ctx.check('KW_END_SUBTYPE_CONSTRAINT') && !ctx.isEOF()) {
    supertypeExpression = parseSupertypeExpression(ctx);
    parseSemicolon(ctx);
  }

  ctx.expect('KW_END_SUBTYPE_CONSTRAINT');
  parseSemicolon(ctx);

  return {
    type: 'SubtypeConstraintDeclaration',
    name,
    entity,
    ...(abstractSupertype ? { abstractSupertype } : {}),
    ...(totalOver ? { totalOver } : {}),
    ...(supertypeExpression ? { supertypeExpression } : {}),
    span: ctx.spanFrom(start),
  };
}

// ── Constant Declaration ────────────────────────────────────────────

function parseConstantDeclaration(ctx: ParserContext): ConstantDeclarationNode {
  const start = ctx.startPos();
  ctx.expect('KW_CONSTANT');

  const constants: ConstantValueDeclarationNode[] = [];
  while (!ctx.isEOF() && !ctx.check('KW_END_CONSTANT')) {
    if (
      ctx.current().kind === 'IDENT' &&
      ctx.current().text.toUpperCase() === 'END_CONSTANT'
    ) {
      break;
    }
    const cStart = ctx.startPos();
    const name = parseIdentifierOrBuiltin(ctx);
    ctx.expect('SYM_COLON');
    const constantType = parseType(ctx);
    ctx.expect('SYM_ASSIGN');
    const expression = parseExpression(ctx, 0);
    parseSemicolon(ctx);
    constants.push({
      type: 'ConstantValueDeclaration',
      name,
      constantType,
      expression,
      span: ctx.spanFrom(cStart),
    });
  }

  ctx.expect('KW_END_CONSTANT');
  parseSemicolon(ctx);

  return { type: 'ConstantDeclaration', constants, span: ctx.spanFrom(start) };
}
