import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';
import { ParserContext } from '../../src/parser/context';
import { parseDataSection } from '../../src/parser/data';

function parseData(source: string) {
  const { tokens } = lexP21(source);
  const ctx = new ParserContext(tokens);
  return { node: parseDataSection(ctx), ctx };
}

describe('parseDataSection — simple entities', () => {
  it('parses single simple entity', () => {
    const { node, ctx } = parseData('DATA;\n#1=CPT(0.0,0.0,0.0);\nENDSEC;');
    expect(node.type).toBe('DataSection');
    expect(node.entities).toHaveLength(1);

    const ent = node.entities[0]!;
    expect(ent.type).toBe('SimpleEntityInstance');
    if (ent.type === 'SimpleEntityInstance') {
      expect(ent.id).toBe(1);
      expect(ent.record.keyword).toBe('CPT');
      expect(ent.record.parameters).toHaveLength(3);
    }
    expect(ctx.diagnostics).toHaveLength(0);
  });

  it('parses entity with entity refs', () => {
    const { node } = parseData('DATA;\n#2=VX(#1);\nENDSEC;');
    const ent = node.entities[0]!;
    if (ent.type === 'SimpleEntityInstance') {
      expect(ent.record.parameters).toHaveLength(1);
      expect(ent.record.parameters[0]!.type).toBe('EntityRef');
    }
  });

  it('parses entity with enumeration', () => {
    const { node } = parseData('DATA;\n#21=ED_STRC(#17,.F.);\nENDSEC;');
    const ent = node.entities[0]!;
    if (ent.type === 'SimpleEntityInstance') {
      expect(ent.record.keyword).toBe('ED_STRC');
      expect(ent.record.parameters[1]!.type).toBe('EnumerationValue');
    }
  });

  it('parses entity with null and omitted', () => {
    const { node } = parseData('DATA;\n#5=FOO($,*,#1);\nENDSEC;');
    const ent = node.entities[0]!;
    if (ent.type === 'SimpleEntityInstance') {
      expect(ent.record.parameters[0]!.type).toBe('NullParameter');
      expect(ent.record.parameters[1]!.type).toBe('OmittedParameter');
      expect(ent.record.parameters[2]!.type).toBe('EntityRef');
    }
  });

  it('parses entity with nested list', () => {
    const { node } = parseData('DATA;\n#6=BAR((#1,#2,#3));\nENDSEC;');
    const ent = node.entities[0]!;
    if (ent.type === 'SimpleEntityInstance') {
      expect(ent.record.parameters).toHaveLength(1);
      expect(ent.record.parameters[0]!.type).toBe('List');
    }
  });

  it('parses entity with typed parameter', () => {
    const { node } = parseData('DATA;\n#7=BAZ(SOME_TYPE(42));\nENDSEC;');
    const ent = node.entities[0]!;
    if (ent.type === 'SimpleEntityInstance') {
      expect(ent.record.parameters[0]!.type).toBe('TypedParameter');
    }
  });

  it('parses multiple entities', () => {
    const src = [
      'DATA;',
      '#1=CPT(0.0,0.0,0.0);',
      '#2=CPT(0.0,1.0,0.0);',
      '#3=CPT(1.0,0.0,0.0);',
      'ENDSEC;',
    ].join('\n');
    const { node } = parseData(src);
    expect(node.entities).toHaveLength(3);
  });

  it('parses entity with string parameters', () => {
    const { node } = parseData(
      "DATA;\n#16=PRODUCT('A0001','Test Part 1','',(#18));\nENDSEC;",
    );
    const ent = node.entities[0]!;
    if (ent.type === 'SimpleEntityInstance') {
      expect(ent.record.keyword).toBe('PRODUCT');
      expect(ent.record.parameters).toHaveLength(4);
    }
  });
});
