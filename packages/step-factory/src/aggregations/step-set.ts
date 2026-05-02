import type { AttributeValue, StepSet } from '../types/values';

export function createSet(elements: AttributeValue[] = []): StepSet {
  const unique = deduplicatePrimitives(elements);
  return { kind: 'set', elements: unique };
}

function deduplicatePrimitives(elements: AttributeValue[]): AttributeValue[] {
  const seen = new Set<unknown>();
  const result: AttributeValue[] = [];
  for (const el of elements) {
    if (typeof el === 'object' && el !== null) {
      result.push(el);
    } else {
      if (!seen.has(el)) {
        seen.add(el);
        result.push(el);
      }
    }
  }
  return result;
}
