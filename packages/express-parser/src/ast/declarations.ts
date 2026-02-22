import type { ASTNodeBase } from './base';
import type { ExpressionNode } from './expressions';
import type { StatementNode } from './statements';
import type { TypeNode } from './types';

// ── Base declaration node ──────────────────────────────────────────────

/** Base interface for all declaration nodes */
export interface DeclarationNodeBase extends ASTNodeBase {
  readonly type: DeclarationKind;
}

// ── Schema declarations ────────────────────────────────────────────────

export interface SchemaDeclarationNode extends DeclarationNodeBase {
  readonly type: 'SchemaDeclaration';
  readonly name: string;
  readonly versionId?: string;
  readonly interfaces: readonly InterfaceClauseNode[];
  readonly declarations: readonly DeclarationNode[];
}

export type InterfaceClauseNode = UseClauseNode | ReferenceClauseNode;

export interface UseClauseNode extends ASTNodeBase {
  readonly type: 'UseClause';
  readonly schemaName: string;
  readonly items?: readonly RenamedRefNode[];
}

export interface ReferenceClauseNode extends ASTNodeBase {
  readonly type: 'ReferenceClause';
  readonly schemaName: string;
  readonly items?: readonly RenamedRefNode[];
}

export interface RenamedRefNode extends ASTNodeBase {
  readonly type: 'RenamedRef';
  readonly name: string;
  readonly alias?: string; // AS alias
}

// ── Entity declarations ────────────────────────────────────────────────

export interface EntityDeclarationNode extends DeclarationNodeBase {
  readonly type: 'EntityDeclaration';
  readonly name: string;
  readonly abstract?: boolean;
  readonly supertypeConstraint?: SupertypeConstraintNode;
  readonly subtypeOf?: SubtypeOfNode;
  readonly attributes: readonly ExplicitAttributeNode[];
  readonly derivedAttributes?: readonly DerivedAttributeNode[];
  readonly inverseAttributes?: readonly InverseAttributeNode[];
  readonly uniqueRules?: readonly UniqueRuleNode[];
  readonly whereRules?: readonly WhereRuleNode[];
}

export interface SupertypeConstraintNode extends ASTNodeBase {
  readonly type: 'SupertypeConstraint';
  readonly expression: SupertypeExpressionNode;
}

export interface SubtypeOfNode extends ASTNodeBase {
  readonly type: 'SubtypeOf';
  readonly entities: readonly string[];
}

// ── Attribute nodes ────────────────────────────────────────────────────

export interface ExplicitAttributeNode extends ASTNodeBase {
  readonly type: 'ExplicitAttribute';
  readonly names: readonly string[]; // can declare multiple: a, b : Type;
  readonly optional?: boolean;
  readonly attributeType: TypeNode;
}

export interface DerivedAttributeNode extends ASTNodeBase {
  readonly type: 'DerivedAttribute';
  readonly name: string;
  readonly attributeType: TypeNode;
  readonly expression: ExpressionNode;
}

export interface InverseAttributeNode extends ASTNodeBase {
  readonly type: 'InverseAttribute';
  readonly name: string;
  readonly attributeType: TypeNode;
  readonly invertedEntity: string;
  readonly invertedAttribute: string;
}

// ── Constraint nodes ───────────────────────────────────────────────────

export interface UniqueRuleNode extends ASTNodeBase {
  readonly type: 'UniqueRule';
  readonly label?: string;
  readonly attributes: readonly string[];
}

export interface WhereRuleNode extends ASTNodeBase {
  readonly type: 'WhereRule';
  readonly label?: string;
  readonly expression: ExpressionNode;
}

// ── Type declarations ──────────────────────────────────────────────────

export interface TypeDeclarationNode extends DeclarationNodeBase {
  readonly type: 'TypeDeclaration';
  readonly name: string;
  readonly underlyingType: TypeNode;
  readonly whereRules?: readonly WhereRuleNode[];
}

// ── Function and procedure declarations ────────────────────────────────

export interface FunctionDeclarationNode extends DeclarationNodeBase {
  readonly type: 'FunctionDeclaration';
  readonly name: string;
  readonly parameters: readonly ParameterNode[];
  readonly returnType: TypeNode;
  readonly declarations?: readonly (
    | TypeDeclarationNode
    | ConstantDeclarationNode
    | LocalVariableNode
  )[];
  readonly body: readonly StatementNode[];
}

export interface ProcedureDeclarationNode extends DeclarationNodeBase {
  readonly type: 'ProcedureDeclaration';
  readonly name: string;
  readonly parameters: readonly ParameterNode[];
  readonly declarations?: readonly (
    | TypeDeclarationNode
    | ConstantDeclarationNode
    | LocalVariableNode
  )[];
  readonly body: readonly StatementNode[];
}

export interface ParameterNode extends ASTNodeBase {
  readonly type: 'Parameter';
  readonly names: readonly string[];
  readonly parameterType: TypeNode;
  readonly isVar?: boolean;
}

// ── Rule declarations ──────────────────────────────────────────────────

export interface RuleDeclarationNode extends DeclarationNodeBase {
  readonly type: 'RuleDeclaration';
  readonly name: string;
  readonly entities: readonly string[];
  readonly declarations?: readonly (
    | TypeDeclarationNode
    | ConstantDeclarationNode
    | LocalVariableNode
  )[];
  readonly body: readonly StatementNode[];
  readonly whereRules?: readonly WhereRuleNode[];
}

// ── Subtype constraint declarations ────────────────────────────────────

export interface SubtypeConstraintDeclarationNode extends DeclarationNodeBase {
  readonly type: 'SubtypeConstraintDeclaration';
  readonly name: string;
  readonly entity: string;
  readonly abstractSupertype?: boolean;
  readonly totalOver?: readonly string[];
  readonly supertypeExpression?: SupertypeExpressionNode;
}

// ── Constant declarations ──────────────────────────────────────────────

export interface ConstantDeclarationNode extends DeclarationNodeBase {
  readonly type: 'ConstantDeclaration';
  readonly constants: readonly ConstantValueDeclarationNode[];
}

export interface ConstantValueDeclarationNode extends DeclarationNodeBase {
  readonly type: 'ConstantValueDeclaration';
  readonly name: string;
  readonly constantType: TypeNode;
  readonly expression: ExpressionNode;
}

// ── Local variable declarations ────────────────────────────────────────

export interface LocalVariableNode extends ASTNodeBase {
  readonly type: 'LocalVariable';
  readonly name: string;
  readonly variableType: TypeNode;
  readonly initialValue?: ExpressionNode;
}

// ── Forward declarations ───────────────────────────────────────────────

/** Forward declaration for supertype expressions */
export interface SupertypeExpressionNode extends ASTNodeBase {
  readonly type: 'SupertypeExpression';
  readonly expression: ExpressionNode; // Simplified - could be expanded to ONEOF/AND specific nodes
}

// ── Declaration union ──────────────────────────────────────────────────

export type DeclarationKind =
  | 'SchemaDeclaration'
  | 'EntityDeclaration'
  | 'TypeDeclaration'
  | 'FunctionDeclaration'
  | 'ProcedureDeclaration'
  | 'RuleDeclaration'
  | 'SubtypeConstraintDeclaration'
  | 'ConstantDeclaration'
  | 'ConstantValueDeclaration';

export type DeclarationNode =
  | SchemaDeclarationNode
  | EntityDeclarationNode
  | TypeDeclarationNode
  | FunctionDeclarationNode
  | ProcedureDeclarationNode
  | RuleDeclarationNode
  | SubtypeConstraintDeclarationNode
  | ConstantDeclarationNode
  | ConstantValueDeclarationNode;
