import type { EntityInstance } from '../types/instance';
import type { EvalValue } from './types';
import { EVAL_INDETERMINATE } from './types';

export function resolveAttributeOnInstance(
  instance: EntityInstance,
  attrName: string,
): EvalValue {
  const key = attrName.toUpperCase();
  const val = instance.attributes.get(key);
  if (val !== undefined) return val as unknown as EvalValue;
  return EVAL_INDETERMINATE;
}

export function resolveGroupQualifier(
  instance: EntityInstance,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _entityName: string,
): EntityInstance {
  // In our model, an EntityInstance already carries all inherited attributes
  // via getAllAttributes in the constructor. The group qualifier \EntityName
  // is used in EXPRESS to disambiguate attributes from a specific supertype.
  // Since we normalize all attributes to UPPERCASE and the instance already
  // has them flattened, we simply return the same instance.
  return instance;
}

export function resolveIndexOnAggregate(
  value: EvalValue,
  index: number,
  lowerIndex: number = 1,
): EvalValue {
  if (Array.isArray(value)) {
    const adjustedIdx = index - lowerIndex;
    return value[adjustedIdx] ?? EVAL_INDETERMINATE;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'kind' in value &&
    'elements' in value
  ) {
    const agg = value as {
      kind: string;
      elements: readonly unknown[];
      lowerIndex?: number;
    };
    const aggLower = agg.lowerIndex ?? 1;
    const adjustedIdx = index - aggLower;
    const el = agg.elements[adjustedIdx];
    return (el ?? EVAL_INDETERMINATE) as EvalValue;
  }

  if (typeof value === 'string') {
    return value[index - 1] ?? EVAL_INDETERMINATE;
  }

  return EVAL_INDETERMINATE;
}

export function isEntityInstanceValue(val: EvalValue): val is EntityInstance {
  return (
    typeof val === 'object' &&
    val !== null &&
    !Array.isArray(val) &&
    'id' in val &&
    'definition' in val &&
    'attributes' in val
  );
}
