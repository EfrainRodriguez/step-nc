import type { AggregationTypeDescriptor } from '@step-nc/express-dictionary';
import type { FactoryDiagnostic } from '../diagnostics';
import { errorDiag, infoDiag } from '../diagnostics';
import type {
  AttributeValue,
  StepAggregation,
  StepArray,
  StepBag,
  StepList,
  StepSet,
} from '../types/values';
import { extractBoundValue } from '../types/values';

export function aggregationSize(agg: StepAggregation): number {
  return agg.elements.length;
}

export function aggregationElements(
  agg: StepAggregation,
): readonly AttributeValue[] {
  return agg.elements as readonly AttributeValue[];
}

export function addToAggregation(
  agg: StepAggregation,
  value: AttributeValue,
): StepAggregation {
  switch (agg.kind) {
    case 'list':
      return { kind: 'list', elements: [...agg.elements, value] };

    case 'set': {
      const exists = agg.elements.some((el) => {
        if (typeof el !== 'object' && typeof value !== 'object') {
          return el === value;
        }
        return false;
      });
      if (exists) return agg;
      return { kind: 'set', elements: [...agg.elements, value] };
    }

    case 'bag':
      return { kind: 'bag', elements: [...agg.elements, value] };

    case 'array':
      return agg;
  }
}

export function removeFromAggregation(
  agg: StepAggregation,
  index: number,
): StepAggregation {
  switch (agg.kind) {
    case 'list': {
      const elements = [...agg.elements];
      elements.splice(index, 1);
      return { kind: 'list', elements } as StepList;
    }

    case 'set': {
      const elements = [...agg.elements];
      elements.splice(index, 1);
      return { kind: 'set', elements } as StepSet;
    }

    case 'bag': {
      const elements = [...agg.elements];
      elements.splice(index, 1);
      return { kind: 'bag', elements } as StepBag;
    }

    case 'array': {
      const elements = [...agg.elements];
      if (index >= 0 && index < elements.length) {
        elements[index] = null;
      }
      return {
        kind: 'array',
        lowerIndex: agg.lowerIndex,
        elements,
      } as StepArray;
    }
  }
}

export function validateAggregationBounds(
  agg: StepAggregation,
  descriptor: AggregationTypeDescriptor,
): FactoryDiagnostic | undefined {
  if (!descriptor.bounds) return undefined;

  const lower = extractBoundValue(descriptor.bounds.lower);
  const upper = extractBoundValue(descriptor.bounds.upper);

  if (lower === undefined && upper === undefined) {
    return infoDiag(
      'BOUNDS_VIOLATION',
      `Bounds contain non-literal expressions; skipping validation`,
    );
  }

  const size = agg.elements.length;

  if (lower !== undefined && size < lower) {
    return errorDiag(
      'BOUNDS_VIOLATION',
      `Aggregation has ${size} element(s), minimum is ${lower}`,
    );
  }

  if (upper !== undefined && size > upper) {
    return errorDiag(
      'BOUNDS_VIOLATION',
      `Aggregation has ${size} element(s), maximum is ${upper}`,
    );
  }

  return undefined;
}
