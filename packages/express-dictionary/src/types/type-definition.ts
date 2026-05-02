import type { WhereRuleDefinition } from './constraint';
import type { TypeDescriptor } from './type-descriptor';

/** Forward reference to ExpressSchema */
export interface SchemaHost {
  readonly name: string;
}

export interface TypeDefinition {
  readonly name: string;
  schema: SchemaHost;
  underlyingType: TypeDescriptor;
  whereRules: WhereRuleDefinition[];
}
