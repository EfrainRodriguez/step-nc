import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';

describe('lexP21 — numbers', () => {
  it('lexes integers', () => {
    const result = lexP21('0 42 1234');
    const nums = result.tokens.filter((t) => t.kind !== 'EOF');
    expect(nums).toHaveLength(3);
    expect(nums[0]!.kind).toBe('INTEGER');
    expect(nums[0]!.text).toBe('0');
    expect(nums[1]!.kind).toBe('INTEGER');
    expect(nums[1]!.text).toBe('42');
    expect(nums[2]!.kind).toBe('INTEGER');
    expect(nums[2]!.text).toBe('1234');
  });

  it('lexes reals with decimals', () => {
    const result = lexP21('0.0 3.14 100.0');
    const nums = result.tokens.filter((t) => t.kind !== 'EOF');
    expect(nums).toHaveLength(3);
    expect(nums.every((t) => t.kind === 'REAL')).toBe(true);
    expect(nums[0]!.text).toBe('0.0');
    expect(nums[1]!.text).toBe('3.14');
    expect(nums[2]!.text).toBe('100.0');
  });

  it('lexes reals with exponents', () => {
    const result = lexP21('1.0E10 2.5E-3 3.0e+2');
    const nums = result.tokens.filter((t) => t.kind !== 'EOF');
    expect(nums).toHaveLength(3);
    expect(nums.every((t) => t.kind === 'REAL')).toBe(true);
    expect(nums[0]!.text).toBe('1.0E10');
    expect(nums[1]!.text).toBe('2.5E-3');
    expect(nums[2]!.text).toBe('3.0e+2');
  });

  it('does not confuse integer followed by enumeration', () => {
    const result = lexP21('0.0,.F.');
    const tokens = result.tokens.filter((t) => t.kind !== 'EOF');
    expect(tokens[0]!.kind).toBe('REAL');
    expect(tokens[0]!.text).toBe('0.0');
    expect(tokens[1]!.kind).toBe('SYM_COMMA');
    expect(tokens[2]!.kind).toBe('ENUMERATION');
    expect(tokens[2]!.text).toBe('.F.');
  });
});
