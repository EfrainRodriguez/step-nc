import { describe, expect, it } from 'vitest';
import { parseP21 } from '../../src/parser/parser';
import type { P21Visitor } from '../../src/visitor/types';
import { visit } from '../../src/visitor/visit';

function makeSampleAst() {
  const src = [
    'ISO-10303-21;',
    'HEADER;',
    "FILE_DESCRIPTION((''),'2;1');",
    "FILE_NAME('test','2024-01-01',(''),(''),'','','');",
    "FILE_SCHEMA(('AUTO'));",
    'ENDSEC;',
    'DATA;',
    '#1=CPT(0.0,0.0,0.0);',
    '#2=VX(#1);',
    "#3=(A(1) B('x'));",
    'ENDSEC;',
    'END-ISO-10303-21;',
  ].join('\n');
  return parseP21(src);
}

describe('visit', () => {
  it('counts entity instances', () => {
    const { ast } = makeSampleAst();
    let count = 0;
    const visitor: P21Visitor = {
      onSimpleEntityInstance() {
        count++;
      },
      onComplexEntityInstance() {
        count++;
      },
    };
    visit(ast, visitor);
    expect(count).toBe(3);
  });

  it('collects entity keywords', () => {
    const { ast } = makeSampleAst();
    const keywords: string[] = [];
    visit(ast, {
      onSimpleRecord(node) {
        keywords.push(node.keyword);
      },
    });
    expect(keywords).toContain('CPT');
    expect(keywords).toContain('VX');
    expect(keywords).toContain('A');
    expect(keywords).toContain('B');
  });

  it('skips children when returning skip', () => {
    const { ast } = makeSampleAst();
    let recordCount = 0;
    visit(ast, {
      onDataSection() {
        return 'skip';
      },
      onSimpleRecord() {
        recordCount++;
      },
    });
    expect(recordCount).toBe(0);
  });

  it('onNode is called for all nodes', () => {
    const { ast } = makeSampleAst();
    let count = 0;
    visit(ast, {
      onNode() {
        count++;
      },
    });
    expect(count).toBeGreaterThan(0);
  });
});
