import type { Span } from '@step-nc/express-parser';

/** Metadata for a USE or REFERENCE FROM clause (unresolved) */
export interface InterfaceSpec {
  readonly kind: 'use' | 'reference';
  readonly schemaName: string;
  readonly items?: readonly InterfaceItemSpec[];
  readonly span: Span;
}

export interface InterfaceItemSpec {
  readonly name: string;
  readonly alias?: string;
}

/**
 * Reference to an entity or type by name.
 * Used inside SELECT types and other cross-references.
 */
export interface NamedTypeReference {
  readonly name: string;
  readonly resolved?: EntityDefinitionRef | TypeDefinitionRef;
}

/** Lightweight forward-reference markers to avoid circular imports */
export interface EntityDefinitionRef {
  readonly kind: 'entity';
  readonly name: string;
}

export interface TypeDefinitionRef {
  readonly kind: 'type';
  readonly name: string;
}
