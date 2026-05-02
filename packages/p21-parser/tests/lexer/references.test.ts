import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';

describe('lexP21 — references', () => {
  it('lexes entity instance names', () => {
    const result = lexP21('#1 #999 #12345');
    const refs = result.tokens.filter((t) => t.kind !== 'EOF');
    expect(refs).toHaveLength(3);
    expect(refs.every((t) => t.kind === 'ENTITY_INSTANCE_NAME')).toBe(true);
    expect(refs[0]!.text).toBe('#1');
    expect(refs[1]!.text).toBe('#999');
    expect(refs[2]!.text).toBe('#12345');
  });

  it('lexes constant entity names', () => {
    const result = lexP21('#IMPERIAL_LENGTH_INCH');
    expect(result.tokens[0]!.kind).toBe('CONSTANT_ENTITY_NAME');
    expect(result.tokens[0]!.text).toBe('#IMPERIAL_LENGTH_INCH');
  });

  it('lexes value instance names', () => {
    const result = lexP21('@1 @456');
    const refs = result.tokens.filter((t) => t.kind !== 'EOF');
    expect(refs).toHaveLength(2);
    expect(refs.every((t) => t.kind === 'VALUE_INSTANCE_NAME')).toBe(true);
  });

  it('lexes constant value names', () => {
    const result = lexP21('@SOME_CONST');
    expect(result.tokens[0]!.kind).toBe('CONSTANT_VALUE_NAME');
    expect(result.tokens[0]!.text).toBe('@SOME_CONST');
  });

  it('lexes anchor names', () => {
    const result = lexP21('<POINT_1>');
    expect(result.tokens[0]!.kind).toBe('ANCHOR_NAME');
    expect(result.tokens[0]!.text).toBe('<POINT_1>');
  });

  it('lexes resources (URIs)', () => {
    const result = lexP21('<ftp://ftp.acme.net/second_file.stp#vertex_1>');
    expect(result.tokens[0]!.kind).toBe('RESOURCE');
    expect(result.tokens[0]!.text).toBe(
      '<ftp://ftp.acme.net/second_file.stp#vertex_1>',
    );
  });

  it('lexes enumerations', () => {
    const result = lexP21('.T. .F. .U. .STEEL.');
    const enums = result.tokens.filter((t) => t.kind !== 'EOF');
    expect(enums).toHaveLength(4);
    expect(enums.every((t) => t.kind === 'ENUMERATION')).toBe(true);
    expect(enums[0]!.text).toBe('.T.');
    expect(enums[3]!.text).toBe('.STEEL.');
  });
});
