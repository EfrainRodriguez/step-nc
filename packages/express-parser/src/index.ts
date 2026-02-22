export { lexExpress } from './lexer/lexer';
export type { LexResult } from './lexer/lexer';

export type {
  Token,
  TokenKind,
  LexDiagnostic,
  TokenCategory,
} from './lexer/types';

// AST types
export type { Position, Span, SyntaxKind } from './ast/base';

export type {
  TypeNode,
  SimpleTypeNode,
  AggregationTypeNode,
  EnumerationTypeNode,
  SelectTypeNode,
  NamedTypeNode,
  GenericTypeNode,
  GenericEntityTypeNode,
  AggregateTypeNode,
  SimpleTypeKind,
  AggregationKind,
} from './ast/types';

export type {
  ExpressionNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  IntegerLiteralNode,
  RealLiteralNode,
  StringLiteralNode,
  BinaryLiteralNode,
  LogicalLiteralNode,
  IndeterminateLiteralNode,
  SelfRefNode,
  IdentifierRefNode,
  AttributeRefNode,
  GroupRefNode,
  IndexRefNode,
  QualifiedRefNode,
  EnumRefNode,
  FunctionCallExpressionNode,
  QueryExpressionNode,
  AggregateInitializerNode,
  EntityConstructorNode,
  IntervalExpressionNode,
  BinaryOperator,
  UnaryOperator,
  QualifierNode,
  AggregateElementNode,
} from './ast/expressions';

export type {
  StatementNode,
  AssignmentStatementNode,
  ProcedureCallStatementNode,
  IfStatementNode,
  CaseStatementNode,
  CaseActionNode,
  RepeatStatementNode,
  RepeatControlNode,
  AliasStatementNode,
  ReturnStatementNode,
  SkipStatementNode,
  EscapeStatementNode,
  NullStatementNode,
  CompoundStatementNode,
  RepeatControlKind,
} from './ast/statements';
