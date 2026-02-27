import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';
import { ParserContext } from '../../src/parser/context';
import { parseReferenceSection } from '../../src/parser/reference';

function parseRef(source: string) {
  const { tokens } = lexP21(source);
  const ctx = new ParserContext(tokens);
  return { node: parseReferenceSection(ctx), ctx };
}

describe('parseReferenceSection', () => {
  it('parses entity reference', () => {
    const { node, ctx } = parseRef(
      'REFERENCE;\n#11 = <ftp://ftp.acme.net/second_file.stp#vertex_1>;\nENDSEC;',
    );

    expect(node.type).toBe('ReferenceSection');
    expect(node.references).toHaveLength(1);
    expect(node.references[0]!.target).toBe('#11');
    expect(node.references[0]!.targetId).toBe(11);
    expect(node.references[0]!.resource).toBe(
      'ftp://ftp.acme.net/second_file.stp#vertex_1',
    );
    expect(ctx.diagnostics).toHaveLength(0);
  });

  it('parses multiple references', () => {
    const src = [
      'REFERENCE;',
      '#11 = <ftp://example.com/file1.stp#v1>;',
      '#12 = <http://example.com/file2.stp#v2>;',
      'ENDSEC;',
    ].join('\n');
    const { node } = parseRef(src);
    expect(node.references).toHaveLength(2);
  });

  it('parses value instance reference', () => {
    const { node } = parseRef(
      'REFERENCE;\n@5 = <http://example.com/data.stp#some_value>;\nENDSEC;',
    );
    expect(node.references[0]!.target).toBe('@5');
    expect(node.references[0]!.targetId).toBe(5);
  });
});
