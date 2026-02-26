import { describe, expect, it } from 'vitest';
import { expressLikeToRegex } from '../../src/interpreter/like-pattern';
import { applyBinaryOperator } from '../../src/interpreter/operators';

describe('expressLikeToRegex', () => {
  it('literal match', () => {
    expect(expressLikeToRegex('hello').test('hello')).toBe(true);
    expect(expressLikeToRegex('hello').test('HELLO')).toBe(false);
    expect(expressLikeToRegex('hello').test('hello!')).toBe(false);
  });

  it('@ matches any letter', () => {
    const re = expressLikeToRegex('@@@');
    expect(re.test('abc')).toBe(true);
    expect(re.test('ABC')).toBe(true);
    expect(re.test('a1c')).toBe(false);
    expect(re.test('ab')).toBe(false);
  });

  it('^ matches any uppercase letter', () => {
    const re = expressLikeToRegex('^^^');
    expect(re.test('ABC')).toBe(true);
    expect(re.test('abc')).toBe(false);
    expect(re.test('AbC')).toBe(false);
  });

  it('? matches any single character', () => {
    const re = expressLikeToRegex('a?c');
    expect(re.test('abc')).toBe(true);
    expect(re.test('a1c')).toBe(true);
    expect(re.test('a c')).toBe(true);
    expect(re.test('ac')).toBe(false);
  });

  it('$ matches any digit', () => {
    const re = expressLikeToRegex('$$$$');
    expect(re.test('1234')).toBe(true);
    expect(re.test('12ab')).toBe(false);
    expect(re.test('123')).toBe(false);
  });

  it('* matches zero or more characters', () => {
    const re = expressLikeToRegex('a*z');
    expect(re.test('az')).toBe(true);
    expect(re.test('abcz')).toBe(true);
    expect(re.test('a123z')).toBe(true);
    expect(re.test('bz')).toBe(false);
  });

  it('\\ escapes special characters', () => {
    expect(expressLikeToRegex('\\@').test('@')).toBe(true);
    expect(expressLikeToRegex('\\@').test('a')).toBe(false);
    expect(expressLikeToRegex('\\$').test('$')).toBe(true);
    expect(expressLikeToRegex('\\*').test('*')).toBe(true);
    expect(expressLikeToRegex('\\?').test('?')).toBe(true);
  });

  it('combined pattern: product code format', () => {
    const re = expressLikeToRegex('^^-$$$$');
    expect(re.test('AB-1234')).toBe(true);
    expect(re.test('ab-1234')).toBe(false);
    expect(re.test('AB-123')).toBe(false);
    expect(re.test('AB-12345')).toBe(false);
  });
});

describe('LIKE operator via applyBinaryOperator', () => {
  it('returns true for matching pattern', () => {
    expect(applyBinaryOperator('LIKE', 'hello', '*llo')).toBe(true);
  });

  it('returns false for non-matching pattern', () => {
    expect(applyBinaryOperator('LIKE', 'hello', '$$$$')).toBe(false);
  });

  it('returns INDETERMINATE for non-string operands', () => {
    const result = applyBinaryOperator('LIKE', 42, 'pattern');
    expect(typeof result).toBe('symbol');
  });
});
