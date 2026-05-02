import type { ExpressionNode } from '@step-nc/express-parser';

/** Forward reference */
export interface EntityDefinitionHost {
  readonly name: string;
}

export interface WhereRuleDefinition {
  readonly label?: string;
  readonly expression: ExpressionNode;
}

export interface UniqueRuleDefinition {
  readonly label?: string;
  readonly attributeNames: readonly string[];
  resolvedAttributes?: readonly { name: string }[];
}

export type SupertypeExpressionInfo =
  | { readonly kind: 'oneof'; readonly entities: EntityDefinitionHost[] }
  | {
      readonly kind: 'and';
      readonly left: SupertypeExpressionInfo;
      readonly right: SupertypeExpressionInfo;
    }
  | {
      readonly kind: 'andor';
      readonly left: SupertypeExpressionInfo;
      readonly right: SupertypeExpressionInfo;
    }
  | { readonly kind: 'entity'; readonly entity: EntityDefinitionHost };

export interface SubtypeConstraintDefinition {
  readonly name: string;
  readonly entityName: string;
  entity?: EntityDefinitionHost;
  readonly abstractSupertype?: boolean;
  readonly totalOver?: readonly string[];
  supertypeExpression?: SupertypeExpressionInfo;
}
