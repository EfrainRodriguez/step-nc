import type { StepArray } from '../types/values';

export function createArray(lowerIndex: number, size: number): StepArray {
  const elements = new Array<null>(size).fill(null);
  return { kind: 'array', lowerIndex, elements };
}
