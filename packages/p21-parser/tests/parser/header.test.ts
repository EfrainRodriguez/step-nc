import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';
import { ParserContext } from '../../src/parser/context';
import { parseHeaderSection } from '../../src/parser/header';

function parseHeader(source: string) {
  const { tokens } = lexP21(source);
  const ctx = new ParserContext(tokens);
  return { node: parseHeaderSection(ctx), ctx };
}

describe('parseHeaderSection', () => {
  it('parses minimal header', () => {
    const src = [
      'HEADER;',
      "FILE_DESCRIPTION((''),'2;1');",
      "FILE_NAME('test','2024-01-01',(''),(''),'','','');",
      "FILE_SCHEMA(('AUTO'));",
      'ENDSEC;',
    ].join('\n');
    const { node, ctx } = parseHeader(src);

    expect(node.type).toBe('HeaderSection');
    expect(node.entities).toHaveLength(3);
    expect(node.entities[0]!.keyword).toBe('FILE_DESCRIPTION');
    expect(node.entities[1]!.keyword).toBe('FILE_NAME');
    expect(node.entities[2]!.keyword).toBe('FILE_SCHEMA');
    expect(ctx.diagnostics).toHaveLength(0);
  });

  it('parses header with extra entities', () => {
    const src = [
      'HEADER;',
      "FILE_DESCRIPTION((''),'2;1');",
      "FILE_NAME('test','2024-01-01',(''),(''),'','','');",
      "FILE_SCHEMA(('AUTO'));",
      "SCHEMA_POPULATION((('ftp://example.com/file.stp',$,'abc123')));",
      'ENDSEC;',
    ].join('\n');
    const { node } = parseHeader(src);

    expect(node.entities).toHaveLength(4);
    expect(node.entities[3]!.keyword).toBe('SCHEMA_POPULATION');
  });

  it('parses real-world header from example file', () => {
    const src = [
      'HEADER;',
      "FILE_DESCRIPTION(('THIS FILE CONTAINS A SMALL SAMPLE STEP MODEL'),'3;1');",
      "FILE_NAME('EXAMPLE STEP FILE #1',",
      "'1992-02-11T15:30:00',",
      "('JOHN DOE',",
      "'ACME INC.',",
      "'METROPOLIS USA'),",
      "('ACME INC. A SUBSIDIARY OF GIANT INDUSTRIES','METROPOLIS USA'),",
      "'CIM/STEP VERSION2',",
      "'SUPER CIM SYSTEM RELEASE 4.0',",
      "'APPROVED BY JOE BLOGGS');",
      "FILE_SCHEMA(('EXAMPLE_GEOMETRY'));",
      'ENDSEC;',
    ].join('\n');
    const { node, ctx } = parseHeader(src);

    expect(node.type).toBe('HeaderSection');
    expect(node.entities).toHaveLength(3);
    expect(ctx.diagnostics).toHaveLength(0);
  });
});
