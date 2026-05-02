import type { ASTNodeBase, SyntaxKind } from './base';
import type { ExpressionNode } from './expressions';

// ── Base type node ────────────────────────────────────────────────────

/** Base interface for all EXPRESS type nodes */
export interface TypeNodeBase extends ASTNodeBase {
  readonly type: SyntaxKind;
}

// ── Simple types ──────────────────────────────────────────────────────

export type SimpleTypeKind =
  | 'NUMBER'
  | 'INTEGER'
  | 'REAL'
  | 'STRING'
  | 'BOOLEAN'
  | 'LOGICAL'
  | 'BINARY';

export interface SimpleTypeNode extends TypeNodeBase {
  readonly type: 'SimpleType';
  readonly kind: SimpleTypeKind;
}

// ── Aggregation types ─────────────────────────────────────────────────

export type AggregationKind = 'ARRAY' | 'LIST' | 'SET' | 'BAG';

export interface AggregationTypeNode extends TypeNodeBase {
  readonly type: 'AggregationType';
  readonly kind: AggregationKind;
  readonly bounds?: {
    readonly lower?: ExpressionNode;
    readonly upper?: ExpressionNode;
  };
  readonly baseType: TypeNode;
}

// ── Enumeration type ──────────────────────────────────────────────────

export interface EnumerationTypeNode extends TypeNodeBase {
  readonly type: 'EnumerationType';
  readonly extensible?: boolean;
  readonly basedOn?: string; // For extensible enumerations
  readonly values: readonly string[];
}

// ── Select type ───────────────────────────────────────────────────────

export interface SelectTypeNode extends TypeNodeBase {
  readonly type: 'SelectType';
  readonly extensible?: boolean;
  readonly generic?: boolean;
  readonly basedOn?: readonly string[]; // For extensible selects
  readonly types: readonly string[];
}

// ── Named type ────────────────────────────────────────────────────────

export interface NamedTypeNode extends TypeNodeBase {
  readonly type: 'NamedType';
  readonly name: string;
}

// ── Generic types ─────────────────────────────────────────────────────

export interface GenericTypeNode extends TypeNodeBase {
  readonly type: 'GenericType';
}

export interface GenericEntityTypeNode extends TypeNodeBase {
  readonly type: 'GenericEntityType';
}

// ── Aggregate type ────────────────────────────────────────────────────

export interface AggregateTypeNode extends TypeNodeBase {
  readonly type: 'AggregateType';
  readonly baseType: TypeNode;
}

// ── Union type ────────────────────────────────────────────────────────

export type TypeNode =
  | SimpleTypeNode
  | AggregationTypeNode
  | EnumerationTypeNode
  | SelectTypeNode
  | NamedTypeNode
  | GenericTypeNode
  | GenericEntityTypeNode
  | AggregateTypeNode;
