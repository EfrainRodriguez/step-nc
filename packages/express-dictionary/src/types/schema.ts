import type { SchemaDiagnostic } from '../diagnostics';
import type {
  ConstantDefinition,
  FunctionDefinition,
  ProcedureDefinition,
  RuleDefinition,
} from './callable';
import type { InterfaceSpec } from './common';
import type { SubtypeConstraintDefinition } from './constraint';
import type { EntityDefinition } from './entity';
import type { TypeDefinition } from './type-definition';

export interface ExpressSchema {
  readonly name: string;
  readonly versionId?: string;
  entities: Map<string, EntityDefinition>;
  types: Map<string, TypeDefinition>;
  functions: Map<string, FunctionDefinition>;
  procedures: Map<string, ProcedureDefinition>;
  rules: Map<string, RuleDefinition>;
  constants: Map<string, ConstantDefinition>;
  subtypeConstraints: Map<string, SubtypeConstraintDefinition>;
  interfaces: InterfaceSpec[];
  diagnostics: SchemaDiagnostic[];
}
