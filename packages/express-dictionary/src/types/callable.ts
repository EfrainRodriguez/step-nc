import type {
  ConstantDeclarationNode,
  ExpressionNode,
  FunctionDeclarationNode,
  LocalVariableNode,
  ProcedureDeclarationNode,
  StatementNode,
  TypeDeclarationNode,
} from '@step-nc/express-parser';
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

/** Union of declarations that can appear inside a function/procedure body header */
export type FunctionLocalDeclaration =
  | TypeDeclarationNode
  | ConstantDeclarationNode
  | LocalVariableNode
  | FunctionDeclarationNode
  | ProcedureDeclarationNode;

export interface FunctionDefinition {
  readonly name: string;
  schema: SchemaHost;
  parameters: ParameterDefinition[];
  returnType: TypeDescriptor;
  /** Body AST preserved for user-defined function evaluation. Absent when imported without AST. */
  body?: readonly StatementNode[];
  /** Local declarations (VAR, TYPE, CONSTANT, nested FUNCTION/PROCEDURE) inside the function. */
  localDeclarations?: readonly FunctionLocalDeclaration[];
}

export interface ProcedureDefinition {
  readonly name: string;
  schema: SchemaHost;
  parameters: ParameterDefinition[];
  body?: readonly StatementNode[];
  localDeclarations?: readonly FunctionLocalDeclaration[];
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
