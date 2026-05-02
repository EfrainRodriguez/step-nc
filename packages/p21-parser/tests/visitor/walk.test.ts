import { describe, expect, it } from 'vitest';
import { parseP21 } from '../../src/parser/parser';
import { walk } from '../../src/visitor/walk';

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
    'ENDSEC;',
    'END-ISO-10303-21;',
  ].join('\n');
  return parseP21(src);
}

describe('walk', () => {
  it('counts total nodes (pre-order)', () => {
    const { ast } = makeSampleAst();
    let count = 0;
    walk(ast, () => {
      count++;
    });
    expect(count).toBeGreaterThan(0);
  });

  it('counts total nodes (post-order)', () => {
    const { ast } = makeSampleAst();
    let count = 0;
    walk(
      ast,
      () => {
        count++;
      },
      { order: 'post' },
    );
    expect(count).toBeGreaterThan(0);
  });

  it('pre and post order visit same number of nodes', () => {
    const { ast } = makeSampleAst();
    let preCount = 0;
    let postCount = 0;
    walk(ast, () => {
      preCount++;
    });
    walk(
      ast,
      () => {
        postCount++;
      },
      { order: 'post' },
    );
    expect(preCount).toBe(postCount);
  });
});
