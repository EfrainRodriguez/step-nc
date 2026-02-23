export { lexExpress } from './lexer/lexer';
export type { LexResult } from './lexer/lexer';

export type {
  LexDiagnostic,
  Token,
  TokenCategory,
  TokenKind,
} from './lexer/types';

// AST types
export type { Position, Span, SyntaxKind } from './ast/base';

export type {
  AggregateTypeNode,
  AggregationKind,
  AggregationTypeNode,
  EnumerationTypeNode,
  GenericEntityTypeNode,
  GenericTypeNode,
  NamedTypeNode,
  SelectTypeNode,
  SimpleTypeKind,
  SimpleTypeNode,
  TypeNode,
} from './ast/types';

export type {
  AggregateElementNode,
  AggregateInitializerNode,
  AttributeRefNode,
  BinaryExpressionNode,
  BinaryLiteralNode,
  BinaryOperator,
  EntityConstructorNode,
  EnumRefNode,
  ExpressionNode,
  FunctionCallExpressionNode,
  GroupRefNode,
  IdentifierRefNode,
  IndeterminateLiteralNode,
  IndexRefNode,
  IntegerLiteralNode,
  IntervalExpressionNode,
  LogicalLiteralNode,
  QualifiedRefNode,
  QualifierNode,
  QueryExpressionNode,
  RealLiteralNode,
  SelfRefNode,
  StringLiteralNode,
  UnaryExpressionNode,
  UnaryOperator,
} from './ast/expressions';

export type {
  AliasStatementNode,
  AssignmentStatementNode,
  CaseActionNode,
  CaseStatementNode,
  CompoundStatementNode,
  EscapeStatementNode,
  IfStatementNode,
  NullStatementNode,
  ProcedureCallStatementNode,
  RepeatControlKind,
  RepeatControlNode,
  RepeatStatementNode,
  ReturnStatementNode,
  SkipStatementNode,
  StatementNode,
} from './ast/statements';

// Declaration nodes
export type {
  ConstantDeclarationNode,
  ConstantValueDeclarationNode,
  DeclarationKind,
  DeclarationNode,
  DeclarationNodeBase,
  DerivedAttributeNode,
  EntityDeclarationNode,
  ExplicitAttributeNode,
  FunctionDeclarationNode,
  InterfaceClauseNode,
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
} from './ast/declarations';

// Parser context
export { ParserContext } from './parser/context';
export {
  spanBetween,
  spanFromTokens,
  spanOfToken,
  tokenEnd,
  tokenStart,
} from './parser/types';
export type {
  DiagnosticSeverity,
  ParseDiagnostic,
  ParseOptions,
} from './parser/types';

// Parser
export { parseExpress } from './parser/parser';
export type { ParseResult } from './parser/parser';
