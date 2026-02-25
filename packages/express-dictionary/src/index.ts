// ── Main entry point ──────────────────────────────────────────────────
export { buildSchema } from './builder/build-schema';
export type {
  BuildSchemaOptions,
  BuildSchemaResult,
} from './builder/build-schema';

// ── Schema Registry ───────────────────────────────────────────────────
export { SchemaRegistry } from './registry/schema-registry';
export type { BuildResult } from './registry/schema-registry';

// ── Semantic Model Types ──────────────────────────────────────────────
export type {
  AggregationBounds,
  AggregationKind,
  AggregationTypeDescriptor,
  ConstantDefinition,
  DefinedTypeDescriptor,
  DerivedAttribute,
  EntityDefinition,
  EntityTypeDescriptor,
  EnumerationTypeDescriptor,
  ExplicitAttribute,
  ExpressSchema,
  FunctionDefinition,
  GenericEntityTypeDescriptor,
  GenericTypeDescriptor,
  InterfaceItemSpec,
  InterfaceSpec,
  InverseAttribute,
  NamedTypeReference,
  ParameterDefinition,
  ProcedureDefinition,
  RuleDefinition,
  SelectionItem,
  SelectTypeDescriptor,
  SimpleTypeDescriptor,
  SimpleTypeName,
  SubtypeConstraintDefinition,
  SupertypeExpressionInfo,
  TypeDefinition,
  TypeDescriptor,
  UniqueRuleDefinition,
  UnresolvedTypeDescriptor,
  WhereRuleDefinition,
} from './types';

// ── Diagnostics ───────────────────────────────────────────────────────
export {
  createDiagnostic,
  errorDiagnostic,
  filterBySeverity,
  formatDiagnostic,
  hasErrors,
  infoDiagnostic,
  warningDiagnostic,
} from './diagnostics';
export type {
  SchemaDiagnostic,
  SchemaDiagnosticCode,
  SchemaDiagnosticSeverity,
} from './diagnostics';

// ── Query API ─────────────────────────────────────────────────────────
export {
  getAllEntities,
  getAllTypes,
  getEntity,
  getInstantiableEntities,
  getNamedType,
  getType,
} from './query/schema-query';

export {
  getAllAttributes,
  getAllDerivedAttributes,
  getAllInverseAttributes,
  getAllSubtypes,
  getDirectSubtypes,
  getInheritedAttributes,
  getOwnAttributes,
  getSupertypeChain,
  isInstantiable,
  isSubtypeOf,
} from './query/entity-query';

export {
  getSelectOptions,
  isAggregationType,
  isEntityType,
  isEnumerationType,
  isSelectType,
  isSimpleType,
  resolveToBaseType,
} from './query/type-query';
