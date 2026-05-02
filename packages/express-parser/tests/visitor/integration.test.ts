import { describe, expect, it } from 'vitest';
import { parseExpress } from '../../src/parser/parser';
import { visit } from '../../src/visitor/visit';
import { walk } from '../../src/visitor/walk';

describe('visitor integration', () => {
  it('parseExpress + visit: collects entity names', () => {
    const result = parseExpress(
      'SCHEMA s; ENTITY e; x : INTEGER; END_ENTITY; END_SCHEMA;',
    );
    expect(result.ast).toBeDefined();
    const names: string[] = [];
    visit(result.ast, {
      onEntityDeclaration(n) {
        names.push(n.name);
      },
    });
    expect(names).toContain('e');
  });

  it('parseExpress + walk: counts nodes', () => {
    const result = parseExpress(
      'SCHEMA s; ENTITY e; x : INTEGER; END_ENTITY; END_SCHEMA;',
    );
    expect(result.ast).toBeDefined();
    let count = 0;
    walk(result.ast, () => count++);
    expect(count).toBeGreaterThan(0);
  });
});
