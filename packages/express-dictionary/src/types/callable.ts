import type { ExpressionNode } from '@step-nc/express-parser';
import type { TypeDescriptor } from './type-descriptor';

/** Forward reference to ExpressSchema */
export interface SchemaHost {
  readonly name: string;
}

export interface ParameterDefinition {
  readonly name: string;
  type: TypeDescriptor;
  readonly isVar: boolean;
}

export interface FunctionDefinition {
  readonly name: string;
  schema: SchemaHost;
  parameters: ParameterDefinition[];
  returnType: TypeDescriptor;
}

export interface ProcedureDefinition {
  readonly name: string;
  schema: SchemaHost;
  parameters: ParameterDefinition[];
}

export interface RuleDefinition {
  readonly name: string;
  schema: SchemaHost;
  readonly entityNames: readonly string[];
  entities: { name: string }[];
  whereRules: { label?: string; expression: ExpressionNode }[];
}

export interface ConstantDefinition {
  readonly name: string;
  schema: SchemaHost;
  type: TypeDescriptor;
  readonly expression: ExpressionNode;
}
