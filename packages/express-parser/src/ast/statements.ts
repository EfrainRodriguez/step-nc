import type { ASTNodeBase } from './base';
import type { ExpressionNode } from './expressions';

// ── Statement nodes ─────────────────────────────────────────────────────

export interface AssignmentStatementNode extends ASTNodeBase {
  readonly type: 'AssignmentStatement';
  readonly target: ExpressionNode;
  readonly value: ExpressionNode;
}

export interface ProcedureCallStatementNode extends ASTNodeBase {
  readonly type: 'ProcedureCallStatement';
  readonly procedure: string;
  readonly args: readonly ExpressionNode[];
}

export interface IfStatementNode extends ASTNodeBase {
  readonly type: 'IfStatement';
  readonly condition: ExpressionNode;
  readonly thenBranch: readonly StatementNode[];
  readonly elseBranch?: readonly StatementNode[];
}

export interface CaseActionNode extends ASTNodeBase {
  readonly type: 'CaseAction';
  readonly selectors: readonly ExpressionNode[];
  readonly statements: readonly StatementNode[];
}

export interface CaseStatementNode extends ASTNodeBase {
  readonly type: 'CaseStatement';
  readonly selector: ExpressionNode;
  readonly actions: readonly CaseActionNode[];
  readonly otherwise?: readonly StatementNode[];
}

export type RepeatControlKind = 'WHILE' | 'UNTIL' | 'FOR';

export interface RepeatControlNode extends ASTNodeBase {
  readonly type: 'RepeatControl';
  readonly kind: RepeatControlKind;
  readonly condition?: ExpressionNode; // For WHILE/UNTIL
  readonly variable?: string; // For FOR
  readonly initial?: ExpressionNode; // For FOR
  readonly increment?: ExpressionNode; // For FOR
  readonly final?: ExpressionNode; // For FOR
  readonly whileCondition?: ExpressionNode; // For combined FOR+WHILE
  readonly untilCondition?: ExpressionNode; // For combined FOR+UNTIL
}

export interface RepeatStatementNode extends ASTNodeBase {
  readonly type: 'RepeatStatement';
  readonly control?: RepeatControlNode;
  readonly statements: readonly StatementNode[];
}

export interface AliasStatementNode extends ASTNodeBase {
  readonly type: 'AliasStatement';
  readonly variable: string;
  readonly base: ExpressionNode;
  readonly statements: readonly StatementNode[];
}

export interface ReturnStatementNode extends ASTNodeBase {
  readonly type: 'ReturnStatement';
  readonly value?: ExpressionNode;
}

export interface SkipStatementNode extends ASTNodeBase {
  readonly type: 'SkipStatement';
}

export interface EscapeStatementNode extends ASTNodeBase {
  readonly type: 'EscapeStatement';
}

export interface NullStatementNode extends ASTNodeBase {
  readonly type: 'NullStatement';
}

export interface CompoundStatementNode extends ASTNodeBase {
  readonly type: 'CompoundStatement';
  readonly statements: readonly StatementNode[];
}

// ── Union ──────────────────────────────────────────────────────────────

export type StatementNode =
  | AssignmentStatementNode
  | ProcedureCallStatementNode
  | IfStatementNode
  | CaseStatementNode
  | CaseActionNode
  | RepeatStatementNode
  | RepeatControlNode
  | AliasStatementNode
  | ReturnStatementNode
  | SkipStatementNode
  | EscapeStatementNode
  | NullStatementNode
  | CompoundStatementNode;
