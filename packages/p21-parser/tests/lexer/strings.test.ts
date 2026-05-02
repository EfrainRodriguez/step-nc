import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';

describe('lexP21 — strings', () => {
  it('lexes empty string', () => {
    const result = lexP21("''");
    expect(result.tokens[0]!.kind).toBe('STRING');
    expect(result.tokens[0]!.text).toBe("''");
  });

  it('lexes simple string', () => {
    const result = lexP21("'hello world'");
    expect(result.tokens[0]!.kind).toBe('STRING');
    expect(result.tokens[0]!.text).toBe("'hello world'");
  });

  it('lexes string with doubled apostrophe', () => {
    const result = lexP21("'it''s a test'");
    expect(result.tokens[0]!.kind).toBe('STRING');
    expect(result.tokens[0]!.text).toBe("'it''s a test'");
  });

  it('lexes string with control directives', () => {
    const result = lexP21("'\\S\\x'");
    expect(result.tokens[0]!.kind).toBe('STRING');
    expect(result.tokens[0]!.text).toBe("'\\S\\x'");
  });

  it('lexes string with X2 control directive', () => {
    const result = lexP21("'\\X2\\00E9\\X0\\'");
    expect(result.tokens[0]!.kind).toBe('STRING');
    expect(result.tokens[0]!.text).toBe("'\\X2\\00E9\\X0\\'");
  });

  it('reports unterminated string', () => {
    const result = lexP21("'unterminated");
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]!.code).toBe('P21L002');
    expect(result.tokens[0]!.kind).toBe('STRING');
  });

  it('lexes multiple strings', () => {
    const result = lexP21("'first','second'");
    const strings = result.tokens.filter((t) => t.kind === 'STRING');
    expect(strings).toHaveLength(2);
    expect(strings[0]!.text).toBe("'first'");
    expect(strings[1]!.text).toBe("'second'");
  });

  it('lexes string in header context', () => {
    const result = lexP21("FILE_DESCRIPTION(('A typical STEP file'),'2;1')");
    const strings = result.tokens.filter((t) => t.kind === 'STRING');
    expect(strings).toHaveLength(2);
    expect(strings[0]!.text).toBe("'A typical STEP file'");
    expect(strings[1]!.text).toBe("'2;1'");
  });
});
