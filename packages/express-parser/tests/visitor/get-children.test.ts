import { describe, expect, it } from 'vitest';
import type { Span } from '../../src/ast/base';
import { getChildren } from '../../src/ast/children';
import type {
  EntityDeclarationNode,
  SchemaDeclarationNode,
} from '../../src/ast/declarations';
import type {
  BinaryExpressionNode,
  IntegerLiteralNode,
} from '../../src/ast/expressions';
import type {
  IfStatementNode,
  SkipStatementNode,
} from '../../src/ast/statements';
import type { SimpleTypeNode } from '../../src/ast/types';

function span(sl: number, sc: number, el: number, ec: number): Span {
  return {
    start: { offset: 0, line: sl, column: sc },
    end: { offset: 0, line: el, column: ec },
  };
}

const S: Span = span(1, 1, 1, 1);

describe('getChildren', () => {
  it('returns interfaces and declarations for SchemaDeclaration', () => {
    const useClause = {
      type: 'UseClause' as const,
      span: S,
      schemaName: 'other',
    };
    const typeDecl = {
      type: 'TypeDeclaration' as const,
      span: S,
      name: 't',
      underlyingType: {
        type: 'SimpleType' as const,
        span: S,
        kind: 'INTEGER' as const,
      } as SimpleTypeNode,
    };
    const schema: SchemaDeclarationNode = {
      type: 'SchemaDeclaration',
      span: S,
      name: 's',
      interfaces: [useClause],
      declarations: [typeDecl],
    };
    const children = getChildren(schema);
    expect(children).toHaveLength(2);
    expect(children[0]).toBe(useClause);
    expect(children[0]!.type).toBe('UseClause');
    expect(children[0]!.span).toBe(S);
    expect(children[1]).toBe(typeDecl);
    expect(children[1]!.type).toBe('TypeDeclaration');
    expect(children[1]!.span).toBe(S);
  });

  it('returns attributes and whereRules for EntityDeclaration', () => {
    const attrType: SimpleTypeNode = {
      type: 'SimpleType',
      span: S,
      kind: 'INTEGER',
    };
    const attr = {
      type: 'ExplicitAttribute' as const,
      span: S,
      names: ['x'],
      attributeType: attrType,
    };
    const whereExpr: IntegerLiteralNode = {
      type: 'IntegerLiteral',
      span: S,
      value: 1,
    };
    const whereRule = {
      type: 'WhereRule' as const,
      span: S,
      expression: whereExpr,
    };
    const entity: EntityDeclarationNode = {
      type: 'EntityDeclaration',
      span: S,
      name: 'e',
      attributes: [attr],
      whereRules: [whereRule],
    };
    const children = getChildren(entity);
    expect(children).toHaveLength(2);
    expect(children[0]).toBe(attr);
    expect(children[0]!.type).toBe('ExplicitAttribute');
    expect(children[1]).toBe(whereRule);
    expect(children[1]!.type).toBe('WhereRule');
  });

  it('returns left and right for BinaryExpression', () => {
    const left: IntegerLiteralNode = {
      type: 'IntegerLiteral',
      span: S,
      value: 1,
    };
    const right: IntegerLiteralNode = {
      type: 'IntegerLiteral',
      span: S,
      value: 2,
    };
    const bin: BinaryExpressionNode = {
      type: 'BinaryExpression',
      span: S,
      operator: '+',
      left,
      right,
    };
    const children = getChildren(bin);
    expect(children).toHaveLength(2);
    expect(children[0]).toBe(left);
    expect(children[1]).toBe(right);
    expect(children[0]!.type).toBe('IntegerLiteral');
    expect(children[1]!.type).toBe('IntegerLiteral');
  });

  it('returns condition, thenBranch and elseBranch for IfStatement', () => {
    const condition: IntegerLiteralNode = {
      type: 'IntegerLiteral',
      span: S,
      value: 1,
    };
    const skip: SkipStatementNode = { type: 'SkipStatement', span: S };
    const thenBranch = [skip];
    const elseBranch = [
      { type: 'SkipStatement' as const, span: S },
    ] as SkipStatementNode[];
    const ifStmt: IfStatementNode = {
      type: 'IfStatement',
      span: S,
      condition,
      thenBranch,
      elseBranch,
    };
    const children = getChildren(ifStmt);
    expect(children).toHaveLength(3); // condition + thenBranch[0] + elseBranch[0]
    expect(children[0]).toBe(condition);
    expect(children[1]).toBe(skip);
    expect(children[2]!.type).toBe('SkipStatement');
  });

  it('returns empty array for node without children (IntegerLiteral)', () => {
    const literal: IntegerLiteralNode = {
      type: 'IntegerLiteral',
      span: S,
      value: 42,
    };
    const children = getChildren(literal);
    expect(children).toHaveLength(0);
    expect(children).toEqual([]);
  });
});
