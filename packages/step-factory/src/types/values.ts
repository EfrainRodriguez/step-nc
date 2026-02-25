import type { ExpressionNode } from '@step-nc/express-parser';

// ── Branded InstanceId ──────────────────────────────────────────────

export type InstanceId = number & { readonly __brand: 'InstanceId' };

export function asInstanceId(id: number): InstanceId {
  return id as InstanceId;
}

// ── Indeterminate sentinel ──────────────────────────────────────────

export const INDETERMINATE: unique symbol = Symbol.for(
  'step-factory.INDETERMINATE',
);
export type Indeterminate = typeof INDETERMINATE;

// ── Instance reference ──────────────────────────────────────────────

export interface InstanceRef {
  readonly kind: 'ref';
  readonly id: InstanceId;
  readonly entityName: string;
}

// ── Aggregation types (T = unknown avoids circular ref in .d.ts emit) ──

export interface StepList<T = unknown> {
  readonly kind: 'list';
  readonly elements: readonly T[];
}

export interface StepSet<T = unknown> {
  readonly kind: 'set';
  readonly elements: readonly T[];
}

export interface StepBag<T = unknown> {
  readonly kind: 'bag';
  readonly elements: readonly T[];
}

export interface StepArray<T = unknown> {
  readonly kind: 'array';
  readonly lowerIndex: number;
  readonly elements: readonly (T | null)[];
}

export type StepAggregation<T = unknown> =
  | StepList<T>
  | StepSet<T>
  | StepBag<T>
  | StepArray<T>;

// ── Attribute value union (order avoids circular .d.ts) ───────────────

type AttributeValueBase =
  | number
  | string
  | boolean
  | null
  | Uint8Array
  | InstanceRef
  | StepAggregation
  | Indeterminate;

// ── SELECT value ────────────────────────────────────────────────────

export interface SelectValue {
  readonly kind: 'select';
  readonly typePath: readonly string[];
  readonly value: AttributeValueBase | SelectValue;
}

export type AttributeValue = AttributeValueBase | SelectValue;

// ── Type guards ─────────────────────────────────────────────────────

export function isInstanceRef(value: AttributeValue): value is InstanceRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    !ArrayBuffer.isView(value) &&
    'kind' in value &&
    (value as InstanceRef).kind === 'ref'
  );
}

export function isSelectValue(value: AttributeValue): value is SelectValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    !ArrayBuffer.isView(value) &&
    'kind' in value &&
    (value as SelectValue).kind === 'select'
  );
}

export function isStepAggregation(
  value: AttributeValue,
): value is StepAggregation {
  if (
    typeof value !== 'object' ||
    value === null ||
    ArrayBuffer.isView(value)
  ) {
    return false;
  }
  const k = (value as StepAggregation).kind;
  return k === 'list' || k === 'set' || k === 'bag' || k === 'array';
}

export function isIndeterminate(value: AttributeValue): value is Indeterminate {
  return value === INDETERMINATE;
}

// ── Bound extraction helper ─────────────────────────────────────────

export function extractBoundValue(
  expr: ExpressionNode | undefined,
): number | undefined {
  if (!expr) return undefined;
  if (expr.type === 'IntegerLiteral') {
    return expr.value;
  }
  return undefined;
}
