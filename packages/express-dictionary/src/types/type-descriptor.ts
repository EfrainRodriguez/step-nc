import type { ExpressionNode, Span } from '@step-nc/express-parser';

// Forward references to avoid circular deps — resolved at runtime
export interface EntityDefinitionLike {
  readonly name: string;
}

export interface TypeDefinitionLike {
  readonly name: string;
}

export type SimpleTypeName =
  | 'NUMBER'
  | 'INTEGER'
  | 'REAL'
  | 'STRING'
  | 'BOOLEAN'
  | 'LOGICAL'
  | 'BINARY';

export interface SimpleTypeDescriptor {
  readonly kind: 'simple';
  readonly simpleType: SimpleTypeName;
}

export type AggregationKind = 'ARRAY' | 'LIST' | 'SET' | 'BAG';

export interface AggregationBounds {
  readonly lower?: ExpressionNode;
  readonly upper?: ExpressionNode;
}

export interface AggregationTypeDescriptor {
  readonly kind: 'aggregation';
  readonly aggregationKind: AggregationKind;
  readonly bounds?: AggregationBounds;
  readonly elementType: TypeDescriptor;
  readonly unique?: boolean;
  readonly optional?: boolean;
}

export interface EnumerationTypeDescriptor {
  readonly kind: 'enumeration';
  readonly values: readonly string[];
  readonly extensible: boolean;
  readonly basedOn?: TypeDefinitionLike;
}

export interface SelectTypeDescriptor {
  readonly kind: 'select';
  readonly selections: SelectionItem[];
  readonly extensible: boolean;
  readonly generic?: boolean;
  readonly basedOn?: TypeDefinitionLike;
}

export interface SelectionItem {
  readonly name: string;
  resolved?: EntityDefinitionLike | TypeDefinitionLike;
}

export interface EntityTypeDescriptor {
  readonly kind: 'entity';
  entity: EntityDefinitionLike;
}

export interface DefinedTypeDescriptor {
  readonly kind: 'defined';
  definition: TypeDefinitionLike;
}

export interface GenericTypeDescriptor {
  readonly kind: 'generic';
}

export interface GenericEntityTypeDescriptor {
  readonly kind: 'genericEntity';
}

export interface UnresolvedTypeDescriptor {
  readonly kind: 'unresolved';
  readonly name: string;
  readonly span: Span;
}

export type TypeDescriptor =
  | SimpleTypeDescriptor
  | AggregationTypeDescriptor
  | EnumerationTypeDescriptor
  | SelectTypeDescriptor
  | EntityTypeDescriptor
  | DefinedTypeDescriptor
  | GenericTypeDescriptor
  | GenericEntityTypeDescriptor
  | UnresolvedTypeDescriptor;
