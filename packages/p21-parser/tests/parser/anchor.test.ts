import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';
import { parseAnchorSection } from '../../src/parser/anchor';
import { ParserContext } from '../../src/parser/context';

function parseAnchor(source: string) {
  const { tokens } = lexP21(source);
  const ctx = new ParserContext(tokens);
  return { node: parseAnchorSection(ctx), ctx };
}

describe('parseAnchorSection', () => {
  it('parses anchor with entity ref', () => {
    const { node, ctx } = parseAnchor('ANCHOR;\n<POINT_1> = #1;\nENDSEC;');

    expect(node.type).toBe('AnchorSection');
    expect(node.anchors).toHaveLength(1);
    expect(node.anchors[0]!.name).toBe('POINT_1');
    expect(node.anchors[0]!.item.type).toBe('EntityRef');
    expect(ctx.diagnostics).toHaveLength(0);
  });

  it('parses anchor with null', () => {
    const { node } = parseAnchor('ANCHOR;\n<POINT_6> = $;\nENDSEC;');
    expect(node.anchors[0]!.item.type).toBe('NullParameter');
  });

  it('parses anchor with tags', () => {
    const { node } = parseAnchor(
      "ANCHOR;\n<POINT_1> = #1 {label: 'test'};\nENDSEC;",
    );
    expect(node.anchors[0]!.tags).toHaveLength(1);
    expect(node.anchors[0]!.tags[0]!.tag).toBe('label');
    expect(node.anchors[0]!.tags[0]!.item.type).toBe('StringValue');
  });

  it('parses multiple anchors', () => {
    const src = [
      'ANCHOR;',
      '<POINT_1> = #1;',
      '<POINT_2> = #2;',
      '<POINT_3> = #3;',
      'ENDSEC;',
    ].join('\n');
    const { node } = parseAnchor(src);
    expect(node.anchors).toHaveLength(3);
  });
});
