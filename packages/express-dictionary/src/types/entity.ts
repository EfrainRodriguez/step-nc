import type {
  DerivedAttribute,
  ExplicitAttribute,
  InverseAttribute,
} from './attribute';
import type {
  SupertypeExpressionInfo,
  UniqueRuleDefinition,
  WhereRuleDefinition,
} from './constraint';

/** Forward reference to ExpressSchema */
export interface SchemaHost {
  readonly name: string;
}

export interface EntityDefinition {
  readonly name: string;
  schema: SchemaHost;
  readonly abstract: boolean;
  readonly supertypeNames: readonly string[];
  supertypes: EntityDefinition[];
  subtypes: EntityDefinition[];
  explicitAttributes: ExplicitAttribute[];
  derivedAttributes: DerivedAttribute[];
  inverseAttributes: InverseAttribute[];
  uniqueRules: UniqueRuleDefinition[];
  whereRules: WhereRuleDefinition[];
  supertypeExpression?: SupertypeExpressionInfo;
  instantiable: boolean;
}
