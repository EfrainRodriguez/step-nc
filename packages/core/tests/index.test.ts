import { describe, expect, it } from 'vitest';
import { helloSTEPNC } from '../src/index';

describe('@nodesim/core', () => {
  it('hello greets by name', () => {
    expect(helloSTEPNC()).toBe('Hello, STEP-NC!');
  });
});
