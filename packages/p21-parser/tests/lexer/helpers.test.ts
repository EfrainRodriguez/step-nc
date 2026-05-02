import { describe, expect, it } from 'vitest';
import {
  isDigit,
  isHex,
  isKeywordChar,
  isLetter,
  isLower,
  isTagNameChar,
  isUpper,
  isWhitespace,
} from '../../src/lexer/helpers';

describe('isWhitespace', () => {
  it('returns true for whitespace characters', () => {
    expect(isWhitespace(' ')).toBe(true);
    expect(isWhitespace('\t')).toBe(true);
    expect(isWhitespace('\r')).toBe(true);
    expect(isWhitespace('\n')).toBe(true);
    expect(isWhitespace('\f')).toBe(true);
  });

  it('returns false for non-whitespace', () => {
    expect(isWhitespace('a')).toBe(false);
    expect(isWhitespace('0')).toBe(false);
    expect(isWhitespace('#')).toBe(false);
  });
});

describe('isDigit', () => {
  it('returns true for 0-9', () => {
    for (let i = 0; i <= 9; i++) {
      expect(isDigit(String(i))).toBe(true);
    }
  });

  it('returns false for non-digits', () => {
    expect(isDigit('a')).toBe(false);
    expect(isDigit('A')).toBe(false);
    expect(isDigit(' ')).toBe(false);
  });
});

describe('isUpper', () => {
  it('returns true for A-Z', () => {
    expect(isUpper('A')).toBe(true);
    expect(isUpper('Z')).toBe(true);
    expect(isUpper('M')).toBe(true);
  });

  it('returns false for lowercase and others', () => {
    expect(isUpper('a')).toBe(false);
    expect(isUpper('0')).toBe(false);
  });
});

describe('isLower', () => {
  it('returns true for a-z', () => {
    expect(isLower('a')).toBe(true);
    expect(isLower('z')).toBe(true);
  });

  it('returns false for uppercase and others', () => {
    expect(isLower('A')).toBe(false);
    expect(isLower('0')).toBe(false);
  });
});

describe('isLetter', () => {
  it('returns true for letters', () => {
    expect(isLetter('A')).toBe(true);
    expect(isLetter('z')).toBe(true);
  });

  it('returns false for non-letters', () => {
    expect(isLetter('0')).toBe(false);
    expect(isLetter('_')).toBe(false);
  });
});

describe('isHex', () => {
  it('returns true for hex digits', () => {
    expect(isHex('0')).toBe(true);
    expect(isHex('9')).toBe(true);
    expect(isHex('A')).toBe(true);
    expect(isHex('F')).toBe(true);
    expect(isHex('a')).toBe(true);
    expect(isHex('f')).toBe(true);
  });

  it('returns false for non-hex', () => {
    expect(isHex('G')).toBe(false);
    expect(isHex('g')).toBe(false);
    expect(isHex('z')).toBe(false);
  });
});

describe('isKeywordChar', () => {
  it('returns true for uppercase, digit, underscore', () => {
    expect(isKeywordChar('A')).toBe(true);
    expect(isKeywordChar('0')).toBe(true);
    expect(isKeywordChar('_')).toBe(true);
  });

  it('returns false for lowercase', () => {
    expect(isKeywordChar('a')).toBe(false);
  });
});

describe('isTagNameChar', () => {
  it('returns true for letters, digits, underscore', () => {
    expect(isTagNameChar('A')).toBe(true);
    expect(isTagNameChar('a')).toBe(true);
    expect(isTagNameChar('5')).toBe(true);
    expect(isTagNameChar('_')).toBe(true);
  });

  it('returns false for special characters', () => {
    expect(isTagNameChar('#')).toBe(false);
    expect(isTagNameChar(' ')).toBe(false);
  });
});
