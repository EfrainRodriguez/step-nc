import { describe, expect, it } from 'vitest';
import { parseExpress } from '../../src/parser/parser';
import { visit } from '../../src/visitor/visit';
import type { ASTNodeBase } from '../../src/ast/base';

describe('visit', () => {
  const minimalSchema = `
    SCHEMA s;
      ENTITY e;
        x : INTEGER;
      END_ENTITY;
      TYPE t = INTEGER;
      END_TYPE;
    END_SCHEMA;
  `;

  it('visits AST in pre-order and records expected node types', () => {
    const { ast, diagnostics } = parseExpress(minimalSchema);
    expect(diagnostics).toHaveLength(0);

    const order: ASTNodeBase['type'][] = [];
    visit(ast, {
      onSchemaDeclaration(n) {
        order.push(n.type);
      },
      onEntityDeclaration(n) {
        order.push(n.type);
      },
      onTypeDeclaration(n) {
        order.push(n.type);
      },
      onExplicitAttribute(n) {
        order.push(n.type);
      },
      onNamedType(n) {
        order.push(n.type);
      },
      onSimpleType(n) {
        order.push(n.type);
      },
    });

    expect(order.indexOf('SchemaDeclaration')).toBe(0);
    expect(order).toContain('EntityDeclaration');
    expect(order).toContain('TypeDeclaration');
    expect(order).toContain('ExplicitAttribute');
    expect(order).toContain('SimpleType');
    // Pre-order: schema first, then its children (interfaces then declarations)
    const schemaIdx = order.indexOf('SchemaDeclaration');
    const entityIdx = order.indexOf('EntityDeclaration');
    const typeDeclIdx = order.indexOf('TypeDeclaration');
    expect(schemaIdx).toBeLessThan(entityIdx);
    expect(schemaIdx).toBeLessThan(typeDeclIdx);
  });

  it('skips children when handler returns "skip"', () => {
    const { ast, diagnostics } = parseExpress(minimalSchema);
    expect(diagnostics).toHaveLength(0);

    const visited: ASTNodeBase['type'][] = [];
    visit(ast, {
      onSchemaDeclaration(n) {
        visited.push(n.type);
      },
      onEntityDeclaration() {
        visited.push('EntityDeclaration');
        return 'skip';
      },
      onTypeDeclaration(n) {
        visited.push(n.type);
      },
      onExplicitAttribute(n) {
        visited.push(n.type);
      },
      onSimpleType(n) {
        visited.push(n.type);
      },
    });

    expect(visited).toContain('SchemaDeclaration');
    expect(visited).toContain('EntityDeclaration');
    expect(visited).toContain('TypeDeclaration');
    expect(visited).not.toContain('ExplicitAttribute');
    expect(visited.filter((t) => t === 'SimpleType').length).toBe(1);
  });

  it('invokes both specific handler and onNode when both are defined', () => {
    const { ast, diagnostics } = parseExpress(minimalSchema);
    expect(diagnostics).toHaveLength(0);

    const specificCalls: ASTNodeBase['type'][] = [];
    const genericCalls: ASTNodeBase['type'][] = [];
    visit(ast, {
      onTypeDeclaration(n) {
        specificCalls.push(n.type);
      },
      onNode(kind) {
        genericCalls.push(kind);
      },
    });

    expect(specificCalls).toContain('TypeDeclaration');
    expect(genericCalls).toContain('TypeDeclaration');
    const typeDeclGenericCount = genericCalls.filter(
      (k) => k === 'TypeDeclaration',
    ).length;
    expect(typeDeclGenericCount).toBeGreaterThanOrEqual(1);
    expect(specificCalls.filter((k) => k === 'TypeDeclaration').length).toBe(1);
  });
});
