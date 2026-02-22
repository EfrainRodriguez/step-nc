import type { ASTNodeBase } from './base';

// ── Operators ──────────────────────────────────────────────────────

export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | 'DIV'
  | 'MOD'
  | '**'
  | '='
  | '<>'
  | '<'
  | '>'
  | '<='
  | '>='
  | ':=:'
  | ':<>:'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'ANDOR'
  | 'IN'
  | 'LIKE'
  | '||';

export type UnaryOperator = '+' | '-' | 'NOT';

// ── Expression nodes ───────────────────────────────────────────────

export interface BinaryExpressionNode extends ASTNodeBase {
  readonly type: 'BinaryExpression';
  readonly operator: BinaryOperator;
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
}

export interface UnaryExpressionNode extends ASTNodeBase {
  readonly type: 'UnaryExpression';
  readonly operator: UnaryOperator;
  readonly operand: ExpressionNode;
}

// ── Literals ───────────────────────────────────────────────────────

export interface IntegerLiteralNode extends ASTNodeBase {
  readonly type: 'IntegerLiteral';
  readonly value: number;
}

export interface RealLiteralNode extends ASTNodeBase {
  readonly type: 'RealLiteral';
  readonly value: number;
}

export interface StringLiteralNode extends ASTNodeBase {
  readonly type: 'StringLiteral';
  readonly value: string;
}

export interface BinaryLiteralNode extends ASTNodeBase {
  readonly type: 'BinaryLiteral';
  readonly value: string;
}

export interface LogicalLiteralNode extends ASTNodeBase {
  readonly type: 'LogicalLiteral';
  readonly value: 'TRUE' | 'FALSE' | 'UNKNOWN';
}

export interface IndeterminateLiteralNode extends ASTNodeBase {
  readonly type: 'IndeterminateLiteral';
}

export interface SelfRefNode extends ASTNodeBase {
  readonly type: 'SelfRef';
}

// ── References ─────────────────────────────────────────────────────

export interface IdentifierRefNode extends ASTNodeBase {
  readonly type: 'IdentifierRef';
  readonly name: string;
}

export interface AttributeRefNode extends ASTNodeBase {
  readonly type: 'AttributeRef';
  readonly name: string;
}

export interface GroupRefNode extends ASTNodeBase {
  readonly type: 'GroupRef';
  readonly name: string;
}

export interface IndexRefNode extends ASTNodeBase {
  readonly type: 'IndexRef';
  readonly index: ExpressionNode;
  readonly upperIndex?: ExpressionNode;
}

/** Qualifier that appears after a root expression: `.attr`, `\group`, or `[idx]` */
export type QualifierNode = AttributeRefNode | GroupRefNode | IndexRefNode;

export interface QualifiedRefNode extends ASTNodeBase {
  readonly type: 'QualifiedRef';
  readonly root: ExpressionNode;
  readonly qualifiers: readonly QualifierNode[];
}

export interface EnumRefNode extends ASTNodeBase {
  readonly type: 'EnumRef';
  readonly typeName?: string;
  readonly enumValue: string;
}

// ── Compound expressions ───────────────────────────────────────────

export interface FunctionCallExpressionNode extends ASTNodeBase {
  readonly type: 'FunctionCallExpression';
  readonly name: string;
  readonly args: readonly ExpressionNode[];
}

export interface QueryExpressionNode extends ASTNodeBase {
  readonly type: 'QueryExpression';
  readonly variable: string;
  readonly source: ExpressionNode;
  readonly condition: ExpressionNode;
}

export interface AggregateElementNode extends ASTNodeBase {
  readonly type: 'AggregateElement';
  readonly value: ExpressionNode;
  readonly repetition?: ExpressionNode;
}

export interface AggregateInitializerNode extends ASTNodeBase {
  readonly type: 'AggregateInitializer';
  readonly elements: readonly AggregateElementNode[];
}

export interface EntityConstructorNode extends ASTNodeBase {
  readonly type: 'EntityConstructor';
  readonly entity: string;
  readonly args: readonly ExpressionNode[];
}

export interface IntervalExpressionNode extends ASTNodeBase {
  readonly type: 'IntervalExpression';
  readonly low: ExpressionNode;
  readonly lowOp: '<' | '<=';
  readonly value: ExpressionNode;
  readonly highOp: '<' | '<=';
  readonly high: ExpressionNode;
}

// ── Union ──────────────────────────────────────────────────────────

export type ExpressionNode =
  | BinaryExpressionNode
  | UnaryExpressionNode
  | IntegerLiteralNode
  | RealLiteralNode
  | StringLiteralNode
  | BinaryLiteralNode
  | LogicalLiteralNode
  | IndeterminateLiteralNode
  | SelfRefNode
  | IdentifierRefNode
  | QualifiedRefNode
  | FunctionCallExpressionNode
  | QueryExpressionNode
  | AggregateInitializerNode
  | EntityConstructorNode
  | IntervalExpressionNode
  | EnumRefNode;
