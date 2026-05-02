import type { ASTNodeBase, SyntaxKind } from '../ast/base';
import type {
  ConstantDeclarationNode,
  ConstantValueDeclarationNode,
  DerivedAttributeNode,
  EntityDeclarationNode,
  ExplicitAttributeNode,
  FunctionDeclarationNode,
  InverseAttributeNode,
  LocalVariableNode,
  ParameterNode,
  ProcedureDeclarationNode,
  ReferenceClauseNode,
  RenamedRefNode,
  RuleDeclarationNode,
  SchemaDeclarationNode,
  SubtypeConstraintDeclarationNode,
  SubtypeOfNode,
  SupertypeConstraintNode,
  SupertypeExpressionNode,
  TypeDeclarationNode,
  UniqueRuleNode,
  UseClauseNode,
  WhereRuleNode,
} from '../ast/declarations';
import type {
  AggregateElementNode,
  AggregateInitializerNode,
  BinaryExpressionNode,
  EntityConstructorNode,
  FunctionCallExpressionNode,
  IntervalExpressionNode,
  QualifiedRefNode,
  QueryExpressionNode,
  UnaryExpressionNode,
} from '../ast/expressions';
import type {
  AliasStatementNode,
  AssignmentStatementNode,
  CaseActionNode,
  CaseStatementNode,
  CompoundStatementNode,
  IfStatementNode,
  ProcedureCallStatementNode,
  RepeatControlNode,
  RepeatStatementNode,
  ReturnStatementNode,
} from '../ast/statements';
import type {
  AggregateTypeNode,
  AggregationTypeNode,
  EnumerationTypeNode,
  GenericEntityTypeNode,
  GenericTypeNode,
  NamedTypeNode,
  SelectTypeNode,
  SimpleTypeNode,
} from '../ast/types';

/** When returned from a visitor handler, prevents visiting the node's children. */
export type VisitorAction = 'skip';

/**
 * Visitor interface for AST traversal. All handlers are optional.
 * Return 'skip' from a handler to avoid visiting that node's children.
 */
export interface ExpressVisitor {
  onSchemaDeclaration?(node: SchemaDeclarationNode): void | VisitorAction;
  onEntityDeclaration?(node: EntityDeclarationNode): void | VisitorAction;
  onTypeDeclaration?(node: TypeDeclarationNode): void | VisitorAction;
  onFunctionDeclaration?(node: FunctionDeclarationNode): void | VisitorAction;
  onProcedureDeclaration?(node: ProcedureDeclarationNode): void | VisitorAction;
  onRuleDeclaration?(node: RuleDeclarationNode): void | VisitorAction;
  onSubtypeConstraintDeclaration?(
    node: SubtypeConstraintDeclarationNode,
  ): void | VisitorAction;
  onConstantDeclaration?(node: ConstantDeclarationNode): void | VisitorAction;
  onConstantValueDeclaration?(
    node: ConstantValueDeclarationNode,
  ): void | VisitorAction;
  onUseClause?(node: UseClauseNode): void | VisitorAction;
  onReferenceClause?(node: ReferenceClauseNode): void | VisitorAction;
  onRenamedRef?(node: RenamedRefNode): void | VisitorAction;
  onSupertypeConstraint?(node: SupertypeConstraintNode): void | VisitorAction;
  onSubtypeOf?(node: SubtypeOfNode): void | VisitorAction;
  onExplicitAttribute?(node: ExplicitAttributeNode): void | VisitorAction;
  onDerivedAttribute?(node: DerivedAttributeNode): void | VisitorAction;
  onInverseAttribute?(node: InverseAttributeNode): void | VisitorAction;
  onUniqueRule?(node: UniqueRuleNode): void | VisitorAction;
  onWhereRule?(node: WhereRuleNode): void | VisitorAction;
  onParameter?(node: ParameterNode): void | VisitorAction;
  onLocalVariable?(node: LocalVariableNode): void | VisitorAction;
  onSupertypeExpression?(node: SupertypeExpressionNode): void | VisitorAction;
  onSimpleType?(node: SimpleTypeNode): void | VisitorAction;
  onAggregationType?(node: AggregationTypeNode): void | VisitorAction;
  onEnumerationType?(node: EnumerationTypeNode): void | VisitorAction;
  onSelectType?(node: SelectTypeNode): void | VisitorAction;
  onNamedType?(node: NamedTypeNode): void | VisitorAction;
  onGenericType?(node: GenericTypeNode): void | VisitorAction;
  onGenericEntityType?(node: GenericEntityTypeNode): void | VisitorAction;
  onAggregateType?(node: AggregateTypeNode): void | VisitorAction;
  onBinaryExpression?(node: BinaryExpressionNode): void | VisitorAction;
  onUnaryExpression?(node: UnaryExpressionNode): void | VisitorAction;
  onQualifiedRef?(node: QualifiedRefNode): void | VisitorAction;
  onFunctionCallExpression?(
    node: FunctionCallExpressionNode,
  ): void | VisitorAction;
  onQueryExpression?(node: QueryExpressionNode): void | VisitorAction;
  onAggregateInitializer?(node: AggregateInitializerNode): void | VisitorAction;
  onAggregateElement?(node: AggregateElementNode): void | VisitorAction;
  onEntityConstructor?(node: EntityConstructorNode): void | VisitorAction;
  onIntervalExpression?(node: IntervalExpressionNode): void | VisitorAction;
  onAssignmentStatement?(node: AssignmentStatementNode): void | VisitorAction;
  onProcedureCallStatement?(
    node: ProcedureCallStatementNode,
  ): void | VisitorAction;
  onIfStatement?(node: IfStatementNode): void | VisitorAction;
  onCaseStatement?(node: CaseStatementNode): void | VisitorAction;
  onCaseAction?(node: CaseActionNode): void | VisitorAction;
  onRepeatStatement?(node: RepeatStatementNode): void | VisitorAction;
  onRepeatControl?(node: RepeatControlNode): void | VisitorAction;
  onAliasStatement?(node: AliasStatementNode): void | VisitorAction;
  onReturnStatement?(node: ReturnStatementNode): void | VisitorAction;
  onCompoundStatement?(node: CompoundStatementNode): void | VisitorAction;
  /** Optional generic handler for any node (called in addition to the specific handler if present). */
  onNode?(kind: SyntaxKind, node: ASTNodeBase): void | VisitorAction;
}
