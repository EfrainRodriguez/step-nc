import type { AttributeValue, StepBag } from '../types/values';

export function createBag(elements: AttributeValue[] = []): StepBag {
  return { kind: 'bag', elements: [...elements] };
}
