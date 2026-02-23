import { describe, expect, it } from 'vitest';
import { parseExpress } from '../../src/parser/parser';
import { walk } from '../../src/visitor/walk';
import type { ASTNodeBase } from '../../src/ast/base';

const minimalSchema = `
  SCHEMA s;
    ENTITY e;
      x : INTEGER;
    END_ENTITY;
    TYPE t = INTEGER;
    END_TYPE;
  END_SCHEMA;
`;

describe('walk', () => {
  it('counts all nodes when callback increments a counter', () => {
    const { ast, diagnostics } = parseExpress(minimalSchema);
    expect(diagnostics).toHaveLength(0);

    let count = 0;
    walk(ast, () => count++);
    expect(count).toBeGreaterThan(0);
    expect(count).toBeGreaterThanOrEqual(5);
  });

  it('with order "pre", root is the first node visited', () => {
    const { ast, diagnostics } = parseExpress(minimalSchema);
    expect(diagnostics).toHaveLength(0);

    const order: ASTNodeBase[] = [];
    walk(ast, (node) => order.push(node), { order: 'pre' });
    expect(order.length).toBeGreaterThan(0);
    expect(order[0]!.type).toBe('SchemaDeclaration');
  });

  it('with order "post", root is the last node and a leaf appears before its parent', () => {
    const { ast, diagnostics } = parseExpress(minimalSchema);
    expect(diagnostics).toHaveLength(0);

    const order: ASTNodeBase[] = [];
    walk(ast, (node) => order.push(node), { order: 'post' });
    expect(order.length).toBeGreaterThan(0);
    expect(order[order.length - 1]!.type).toBe('SchemaDeclaration');

    const types = order.map((n) => n.type);
    const schemaIdx = types.lastIndexOf('SchemaDeclaration');
    const simpleTypeIdx = types.indexOf('SimpleType');
    if (simpleTypeIdx >= 0) {
      expect(simpleTypeIdx).toBeLessThan(schemaIdx);
    }
  });
});
