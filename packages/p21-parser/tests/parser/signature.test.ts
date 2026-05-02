import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';
import { ParserContext } from '../../src/parser/context';
import { parseSignatureSection } from '../../src/parser/signature';

function parseSig(source: string) {
  const { tokens } = lexP21(source);
  const ctx = new ParserContext(tokens);
  return { node: parseSignatureSection(ctx), ctx };
}

describe('parseSignatureSection', () => {
  it('parses signature with content', () => {
    const src = 'SIGNATURE dGVzdCBzaWduYXR1cmU= ENDSEC;';
    const { node, ctx } = parseSig(src);

    expect(node.type).toBe('SignatureSection');
    expect(node.content.length).toBeGreaterThan(0);
    expect(ctx.diagnostics).toHaveLength(0);
  });

  it('parses empty signature section', () => {
    const { node } = parseSig('SIGNATURE ENDSEC;');
    expect(node.type).toBe('SignatureSection');
    expect(node.content).toBe('');
  });
});
