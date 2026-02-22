/**
 * Position within the EXPRESS source text.
 * Aligned 1:1 with the Token shape from the lexer for zero-cost interop.
 *
 * - offset: zero-based absolute index into the source string
 * - line:   one-based line number
 * - column: one-based column number
 */
export interface Position {
  readonly offset: number;
  readonly line: number;
  readonly column: number;
}

/**
 * Half-open source range [start, end).
 * `start` is the position of the first character;
 * `end` is the position *after* the last character (LSP / VS Code convention).
 */
export interface Span {
  readonly start: Position;
  readonly end: Position;
}

/**
 * Discriminant for every AST node.
 * Organised by category so a `switch` on `node.type` gives exhaustive coverage.
 */
export type SyntaxKind =
  // ── Declarations ────────────────────────────────────────────────
  | 'SchemaDeclaration'
  | 'EntityDeclaration'
  | 'TypeDeclaration'
  | 'FunctionDeclaration'
  | 'ProcedureDeclaration'
  | 'RuleDeclaration'
  | 'SubtypeConstraintDeclaration'
  | 'ConstantDeclaration'
  | 'ConstantValueDeclaration'

  // ── Entity sub-nodes ────────────────────────────────────────────
  | 'SupertypeConstraint'
  | 'SubtypeOf'
  | 'ExplicitAttribute'
  | 'DerivedAttribute'
  | 'InverseAttribute'
  | 'UniqueRule'
  | 'WhereRule'

  // ── Schema sub-nodes ────────────────────────────────────────────
  | 'UseClause'
  | 'ReferenceClause'
  | 'RenamedRef'

  // ── Parameters ──────────────────────────────────────────────────
  | 'Parameter'

  // ── EXPRESS types ───────────────────────────────────────────────
  | 'SimpleType'
  | 'AggregationType'
  | 'EnumerationType'
  | 'SelectType'
  | 'NamedType'
  | 'GenericType'
  | 'GenericEntityType'
  | 'AggregateType'

  // ── Expressions ─────────────────────────────────────────────────
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'IntegerLiteral'
  | 'RealLiteral'
  | 'StringLiteral'
  | 'BinaryLiteral'
  | 'LogicalLiteral'
  | 'IndeterminateLiteral'
  | 'SelfRef'
  | 'IdentifierRef'
  | 'QualifiedRef'
  | 'AttributeRef'
  | 'GroupRef'
  | 'IndexRef'
  | 'FunctionCallExpression'
  | 'QueryExpression'
  | 'AggregateInitializer'
  | 'AggregateElement'
  | 'EntityConstructor'
  | 'IntervalExpression'
  | 'EnumRef'

  // ── Statements ──────────────────────────────────────────────────
  | 'AssignmentStatement'
  | 'ProcedureCallStatement'
  | 'IfStatement'
  | 'CaseStatement'
  | 'CaseAction'
  | 'RepeatStatement'
  | 'RepeatControl'
  | 'AliasStatement'
  | 'ReturnStatement'
  | 'SkipStatement'
  | 'EscapeStatement'
  | 'NullStatement'
  | 'CompoundStatement'

  // ── Variable declarations ───────────────────────────────────────
  | 'LocalVariable';

/**
 * Base interface that every AST node extends.
 *
 * - `type` is the discriminant for narrowing via `switch` / `if`
 * - `span` tracks the source range for diagnostics
 */
export interface ASTNodeBase {
  readonly type: SyntaxKind;
  readonly span: Span;
}
