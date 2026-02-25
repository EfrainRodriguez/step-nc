// ── Types ─────────────────────────────────────────────────────────────
export type { EntityInstance } from './types/instance';
export type { StepModelOptions } from './types/model';
export {
  asInstanceId,
  extractBoundValue,
  INDETERMINATE,
  isIndeterminate,
  isInstanceRef,
  isSelectValue,
  isStepAggregation,
} from './types/values';
export type {
  AttributeValue,
  Indeterminate,
  InstanceId,
  InstanceRef,
  SelectValue,
  StepAggregation,
  StepArray,
  StepBag,
  StepList,
  StepSet,
} from './types/values';

// ── Diagnostics ───────────────────────────────────────────────────────
export {
  createFactoryDiagnostic,
  errorDiag,
  filterBySeverity,
  formatFactoryDiagnostic,
  hasFactoryErrors,
  infoDiag,
  warningDiag,
} from './diagnostics';
export type {
  FactoryDiagnostic,
  FactoryDiagnosticCode,
  FactoryDiagnosticSeverity,
} from './diagnostics';

// ── Model ─────────────────────────────────────────────────────────────
export { StepModel } from './model/step-model';
export type { CreateInstanceResult } from './model/step-model';

// ── Attributes ────────────────────────────────────────────────────────
export {
  getAttribute,
  getAttributeNames,
  getUnsetRequiredAttributes,
  hasAttribute,
  setAttribute,
  setAttributes,
} from './attributes/attribute-access';
export {
  getExpectedTypeName,
  isValueCompatible,
} from './attributes/type-mapping';

// ── Aggregations ──────────────────────────────────────────────────────
export {
  addToAggregation,
  aggregationElements,
  aggregationSize,
  removeFromAggregation,
  validateAggregationBounds,
} from './aggregations/aggregation-factory';
export { createArray } from './aggregations/step-array';
export { createBag } from './aggregations/step-bag';
export { createList } from './aggregations/step-list';
export { createSet } from './aggregations/step-set';

// ── SELECT types ──────────────────────────────────────────────────────
export {
  createSelectValue,
  getSelectActualValue,
  getSelectTypePath,
  validateSelectValue,
} from './select/select-value';

// ── References ────────────────────────────────────────────────────────
export {
  createRef,
  findReferencesTo,
  resolveRef,
  validateReferences,
} from './references/reference-resolver';

// ── Validation ────────────────────────────────────────────────────────
export {
  isInstanceComplete,
  validateInstance,
} from './validation/validate-instance';
export { validateModel } from './validation/validate-model';

// ── Helpers ───────────────────────────────────────────────────────────
export {
  cloneInstance,
  createAndPopulate,
  instanceToRecord,
} from './helpers/builder-helpers';
export type { PopulateResult } from './helpers/builder-helpers';
