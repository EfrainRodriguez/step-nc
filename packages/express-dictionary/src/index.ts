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
  DerivedAttribute,
  ExplicitAttribute,
  InverseAttribute,
} from './types/attribute';
export type {
  ConstantDefinition,
  FunctionDefinition,
  ParameterDefinition,
  ProcedureDefinition,
  RuleDefinition,
} from './types/callable';
export type {
  InterfaceItemSpec,
  InterfaceSpec,
  NamedTypeReference,
} from './types/common';
export type {
  SubtypeConstraintDefinition,
  SupertypeExpressionInfo,
  UniqueRuleDefinition,
  WhereRuleDefinition,
} from './types/constraint';
export type { EntityDefinition } from './types/entity';
export type { ExpressSchema } from './types/schema';
export type { TypeDefinition } from './types/type-definition';
export type {
  AggregationBounds,
  AggregationKind,
  AggregationTypeDescriptor,
  DefinedTypeDescriptor,
  EntityTypeDescriptor,
  EnumerationTypeDescriptor,
  GenericEntityTypeDescriptor,
  GenericTypeDescriptor,
  SelectionItem,
  SelectTypeDescriptor,
  SimpleTypeDescriptor,
  SimpleTypeName,
  TypeDescriptor,
  UnresolvedTypeDescriptor,
} from './types/type-descriptor';

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
  getAllAttributes,
  getAllAttributeSlots,
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
  getAllEntities,
  getAllTypes,
  getEntity,
  getInstantiableEntities,
  getNamedType,
  getType,
} from './query/schema-query';
export {
  getSelectOptions,
  isAggregationType,
  isEntityType,
  isEnumerationType,
  isSelectType,
  isSimpleType,
  resolveToBaseType,
} from './query/type-query';
