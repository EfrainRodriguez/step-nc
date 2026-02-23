import type { ASTNodeBase } from '../ast/base';
import type { SchemaDeclarationNode } from '../ast/declarations';
import { getChildren } from '../ast/children';
import type { ExpressVisitor, VisitorAction } from './types';

const HANDLER_MAP: Partial<Record<ASTNodeBase['type'], keyof ExpressVisitor>> =
  {
    SchemaDeclaration: 'onSchemaDeclaration',
    EntityDeclaration: 'onEntityDeclaration',
    TypeDeclaration: 'onTypeDeclaration',
    FunctionDeclaration: 'onFunctionDeclaration',
    ProcedureDeclaration: 'onProcedureDeclaration',
    RuleDeclaration: 'onRuleDeclaration',
    SubtypeConstraintDeclaration: 'onSubtypeConstraintDeclaration',
    ConstantDeclaration: 'onConstantDeclaration',
    ConstantValueDeclaration: 'onConstantValueDeclaration',
    UseClause: 'onUseClause',
    ReferenceClause: 'onReferenceClause',
    RenamedRef: 'onRenamedRef',
    SupertypeConstraint: 'onSupertypeConstraint',
    SubtypeOf: 'onSubtypeOf',
    ExplicitAttribute: 'onExplicitAttribute',
    DerivedAttribute: 'onDerivedAttribute',
    InverseAttribute: 'onInverseAttribute',
    UniqueRule: 'onUniqueRule',
    WhereRule: 'onWhereRule',
    Parameter: 'onParameter',
    LocalVariable: 'onLocalVariable',
    SupertypeExpression: 'onSupertypeExpression',
    SimpleType: 'onSimpleType',
    AggregationType: 'onAggregationType',
    EnumerationType: 'onEnumerationType',
    SelectType: 'onSelectType',
    NamedType: 'onNamedType',
    GenericType: 'onGenericType',
    GenericEntityType: 'onGenericEntityType',
    AggregateType: 'onAggregateType',
    BinaryExpression: 'onBinaryExpression',
    UnaryExpression: 'onUnaryExpression',
    QualifiedRef: 'onQualifiedRef',
    FunctionCallExpression: 'onFunctionCallExpression',
    QueryExpression: 'onQueryExpression',
    AggregateInitializer: 'onAggregateInitializer',
    AggregateElement: 'onAggregateElement',
    EntityConstructor: 'onEntityConstructor',
    IntervalExpression: 'onIntervalExpression',
    AssignmentStatement: 'onAssignmentStatement',
    ProcedureCallStatement: 'onProcedureCallStatement',
    IfStatement: 'onIfStatement',
    CaseStatement: 'onCaseStatement',
    CaseAction: 'onCaseAction',
    RepeatStatement: 'onRepeatStatement',
    RepeatControl: 'onRepeatControl',
    AliasStatement: 'onAliasStatement',
    ReturnStatement: 'onReturnStatement',
    CompoundStatement: 'onCompoundStatement',
  };

function visitNode(node: ASTNodeBase, visitor: ExpressVisitor): void {
  const key = HANDLER_MAP[node.type];
  const handler = key
    ? (
        visitor as Record<
          string,
          ((n: ASTNodeBase) => void | VisitorAction) | undefined
        >
      )[key]
    : undefined;
  let action: void | VisitorAction;
  if (typeof handler === 'function') {
    action = handler(node as never);
  } else {
    action = undefined;
  }
  if (visitor.onNode) {
    const genericAction = visitor.onNode(node.type, node);
    if (genericAction === 'skip') action = 'skip';
  }
  if (action === 'skip') return;
  const children = getChildren(node);
  for (const child of children) {
    visitNode(child, visitor);
  }
}

/**
 * Visits the AST in pre-order. For each node, the corresponding visitor handler (if present) is called.
 * If a handler returns 'skip', that node's children are not visited.
 */
export function visit(
  ast: SchemaDeclarationNode,
  visitor: ExpressVisitor,
): void {
  visitNode(ast, visitor);
}
