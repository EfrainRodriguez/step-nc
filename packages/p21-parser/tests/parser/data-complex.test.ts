import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';
import { ParserContext } from '../../src/parser/context';
import { parseDataSection } from '../../src/parser/data';

function parseData(source: string) {
  const { tokens } = lexP21(source);
  const ctx = new ParserContext(tokens);
  return { node: parseDataSection(ctx), ctx };
}

describe('parseDataSection — complex entities', () => {
  it('parses single complex entity', () => {
    const src = "DATA;\n#10=(COMP_A(1) COMP_B('x') COMP_C());\nENDSEC;";
    const { node, ctx } = parseData(src);

    expect(node.entities).toHaveLength(1);
    const ent = node.entities[0]!;
    expect(ent.type).toBe('ComplexEntityInstance');
    if (ent.type === 'ComplexEntityInstance') {
      expect(ent.id).toBe(10);
      expect(ent.records).toHaveLength(3);
      expect(ent.records[0]!.keyword).toBe('COMP_A');
      expect(ent.records[1]!.keyword).toBe('COMP_B');
      expect(ent.records[2]!.keyword).toBe('COMP_C');
    }
    expect(ctx.diagnostics).toHaveLength(0);
  });

  it('parses real-world complex entity', () => {
    const src = [
      'DATA;',
      '#14=(',
      "REPRESENTATION_RELATIONSHIP('','',#391,#392)",
      'REPRESENTATION_RELATIONSHIP_WITH_TRANSFORMATION(#10)',
      'SHAPE_REPRESENTATION_RELATIONSHIP()',
      ');',
      'ENDSEC;',
    ].join('\n');
    const { node } = parseData(src);

    const ent = node.entities[0]!;
    expect(ent.type).toBe('ComplexEntityInstance');
    if (ent.type === 'ComplexEntityInstance') {
      expect(ent.records).toHaveLength(3);
    }
  });

  it('parses mix of simple and complex entities', () => {
    const src = [
      'DATA;',
      '#1=CPT(0.0,0.0,0.0);',
      '#2=(A(1) B(2));',
      '#3=VX(#1);',
      'ENDSEC;',
    ].join('\n');
    const { node } = parseData(src);

    expect(node.entities).toHaveLength(3);
    expect(node.entities[0]!.type).toBe('SimpleEntityInstance');
    expect(node.entities[1]!.type).toBe('ComplexEntityInstance');
    expect(node.entities[2]!.type).toBe('SimpleEntityInstance');
  });
});
