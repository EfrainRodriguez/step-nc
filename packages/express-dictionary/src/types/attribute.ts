import type { ExpressionNode } from '@step-nc/express-parser';
import type { TypeDescriptor } from './type-descriptor';

/** Forward reference to EntityDefinition to break circular deps */
export interface EntityDefinitionHost {
  readonly name: string;
}

export interface ExplicitAttribute {
  readonly name: string;
  parentEntity: EntityDefinitionHost;
  type: TypeDescriptor;
  readonly optional: boolean;
  redeclaring?: ExplicitAttribute;
  readonly redeclaredFrom?: {
    readonly entityName: string;
    readonly attributeName: string;
  };
}

export interface DerivedAttribute {
  readonly name: string;
  parentEntity: EntityDefinitionHost;
  type: TypeDescriptor;
  readonly expression: ExpressionNode;
  readonly redeclaredFrom?: {
    readonly entityName: string;
    readonly attributeName: string;
  };
}

export interface InverseAttribute {
  readonly name: string;
  parentEntity: EntityDefinitionHost;
  type: TypeDescriptor;
  invertedEntity?: EntityDefinitionHost;
  invertedAttribute?: ExplicitAttribute;
  readonly invertedEntityName: string;
  readonly invertedAttributeName: string;
  readonly redeclaredFrom?: {
    readonly entityName: string;
    readonly attributeName: string;
  };
}
