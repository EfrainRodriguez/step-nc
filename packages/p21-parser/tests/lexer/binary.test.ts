import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';

describe('lexP21 — binary', () => {
  it('lexes binary literal with initial digit 0', () => {
    const result = lexP21('"0A3F"');
    expect(result.tokens[0]!.kind).toBe('BINARY');
    expect(result.tokens[0]!.text).toBe('"0A3F"');
  });

  it('lexes binary literal with initial digit 3', () => {
    const result = lexP21('"3FF"');
    expect(result.tokens[0]!.kind).toBe('BINARY');
    expect(result.tokens[0]!.text).toBe('"3FF"');
  });

  it('lexes binary literal with initial digit 1', () => {
    const result = lexP21('"1A2F"');
    expect(result.tokens[0]!.kind).toBe('BINARY');
    expect(result.tokens[0]!.text).toBe('"1A2F"');
  });

  it('reports unterminated binary', () => {
    const result = lexP21('"0ABC');
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]!.code).toBe('P21L003');
  });
});
