import type { AttributeValue, StepList } from '../types/values';

export function createList(elements: AttributeValue[] = []): StepList {
  return { kind: 'list', elements: [...elements] };
}
