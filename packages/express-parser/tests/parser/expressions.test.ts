import { describe, expect, it } from 'vitest';
import type { ExpressionNode } from '../../src/ast/expressions';
import { lexExpress } from '../../src/lexer/lexer';
import { ParserContext } from '../../src/parser/context';
import { parseExpression } from '../../src/parser/expressions';

function parseExpr(source: string): ExpressionNode {
  const { tokens } = lexExpress(source);
  const ctx = new ParserContext(tokens);
  return parseExpression(ctx);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseExprWithDiag(source: string) {
  const { tokens } = lexExpress(source);
  const ctx = new ParserContext(tokens);
  const expr = parseExpression(ctx);
  return { expr, diagnostics: ctx.diagnostics };
}

describe('Literals', () => {
  it('should parse integer literal', () => {
    const expr = parseExpr('42');
    expect(expr.type).toBe('IntegerLiteral');
    if (expr.type === 'IntegerLiteral') expect(expr.value).toBe(42);
  });

  it('should parse real literal', () => {
    const expr = parseExpr('3.14');
    expect(expr.type).toBe('RealLiteral');
    if (expr.type === 'RealLiteral') expect(expr.value).toBeCloseTo(3.14);
  });

  it('should parse string literal', () => {
    const expr = parseExpr("'hello'");
    expect(expr.type).toBe('StringLiteral');
    if (expr.type === 'StringLiteral') expect(expr.value).toBe('hello');
  });

  it('should parse binary literal', () => {
    const expr = parseExpr('%0101');
    expect(expr.type).toBe('BinaryLiteral');
    if (expr.type === 'BinaryLiteral') expect(expr.value).toBe('%0101');
  });
});

describe('Logical literals and built-in constants', () => {
  it('should parse TRUE', () => {
    const expr = parseExpr('TRUE');
    expect(expr.type).toBe('LogicalLiteral');
    if (expr.type === 'LogicalLiteral') expect(expr.value).toBe('TRUE');
  });

  it('should parse FALSE', () => {
    const expr = parseExpr('FALSE');
    expect(expr.type).toBe('LogicalLiteral');
    if (expr.type === 'LogicalLiteral') expect(expr.value).toBe('FALSE');
  });

  it('should parse UNKNOWN', () => {
    const expr = parseExpr('UNKNOWN');
    expect(expr.type).toBe('LogicalLiteral');
    if (expr.type === 'LogicalLiteral') expect(expr.value).toBe('UNKNOWN');
  });

  it('should parse ? (indeterminate)', () => {
    const expr = parseExpr('?');
    expect(expr.type).toBe('IndeterminateLiteral');
  });

  it('should parse SELF', () => {
    const expr = parseExpr('SELF');
    expect(expr.type).toBe('SelfRef');
  });

  it('should parse CONST_E as IdentifierRef', () => {
    const expr = parseExpr('CONST_E');
    expect(expr.type).toBe('IdentifierRef');
    if (expr.type === 'IdentifierRef') expect(expr.name).toBe('CONST_E');
  });

  it('should parse PI as IdentifierRef', () => {
    const expr = parseExpr('PI');
    expect(expr.type).toBe('IdentifierRef');
    if (expr.type === 'IdentifierRef') expect(expr.name).toBe('PI');
  });
});

describe('Identifiers', () => {
  it('should parse simple identifier', () => {
    const expr = parseExpr('my_var');
    expect(expr.type).toBe('IdentifierRef');
    if (expr.type === 'IdentifierRef') expect(expr.name).toBe('my_var');
  });
});

describe('Function calls', () => {
  it('should parse function call with no args', () => {
    const expr = parseExpr('foo()');
    expect(expr.type).toBe('FunctionCallExpression');
    if (expr.type === 'FunctionCallExpression') {
      expect(expr.name).toBe('foo');
      expect(expr.args).toHaveLength(0);
    }
  });

  it('should parse function call with args', () => {
    const expr = parseExpr('foo(1, 2, 3)');
    expect(expr.type).toBe('FunctionCallExpression');
    if (expr.type === 'FunctionCallExpression') {
      expect(expr.name).toBe('foo');
      expect(expr.args).toHaveLength(3);
    }
  });

  it('should parse entity constructor as FunctionCallExpression (point(1.0, 2.0, 3.0))', () => {
    const expr = parseExpr('point(1.0, 2.0, 3.0)');
    expect(expr.type).toBe('FunctionCallExpression');
    if (expr.type === 'FunctionCallExpression') {
      expect(expr.name).toBe('point');
      expect(expr.args).toHaveLength(3);
    }
  });
});

describe('Built-in functions', () => {
  it('should parse ABS(x)', () => {
    const expr = parseExpr('ABS(x)');
    expect(expr.type).toBe('FunctionCallExpression');
    if (expr.type === 'FunctionCallExpression') {
      expect(expr.name).toBe('ABS');
      expect(expr.args).toHaveLength(1);
    }
  });

  it('should parse SIZEOF(list)', () => {
    const expr = parseExpr('SIZEOF(list)');
    expect(expr.type).toBe('FunctionCallExpression');
    if (expr.type === 'FunctionCallExpression') {
      expect(expr.name).toBe('SIZEOF');
    }
  });
});

describe('Binary operators — precedence', () => {
  it('a + b * c → a + (b * c)', () => {
    const expr = parseExpr('a + b * c');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe('+');
      expect(expr.right.type).toBe('BinaryExpression');
    }
  });

  it('a * b + c → (a * b) + c', () => {
    const expr = parseExpr('a * b + c');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe('+');
      expect(expr.left.type).toBe('BinaryExpression');
    }
  });

  it('a OR b AND c → a OR (b AND c) (ISO precedence)', () => {
    const expr = parseExpr('a OR b AND c');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe('OR');
      expect(expr.right.type).toBe('BinaryExpression');
      if (expr.right.type === 'BinaryExpression') {
        expect(expr.right.operator).toBe('AND');
      }
    }
  });

  it('a + b = c * d → (a + b) = (c * d)', () => {
    const expr = parseExpr('a + b = c * d');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe('=');
      expect(expr.left.type).toBe('BinaryExpression');
      expect(expr.right.type).toBe('BinaryExpression');
    }
  });
});

describe('Binary operators — associativity', () => {
  it('a + b + c → (a + b) + c (left)', () => {
    const expr = parseExpr('a + b + c');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe('+');
      expect(expr.left.type).toBe('BinaryExpression');
      if (expr.left.type === 'BinaryExpression') {
        expect(expr.left.operator).toBe('+');
      }
    }
  });

  it('a ** b ** c → a ** (b ** c) (right)', () => {
    const expr = parseExpr('a ** b ** c');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe('**');
      expect(expr.right.type).toBe('BinaryExpression');
      if (expr.right.type === 'BinaryExpression') {
        expect(expr.right.operator).toBe('**');
      }
    }
  });

  it('a = b (single comparison)', () => {
    const expr = parseExpr('a = b');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe('=');
    }
  });

  it('should parse instance equality :=: (a :=: b)', () => {
    const expr = parseExpr('a :=: b');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe(':=:');
    }
  });

  it('should parse instance inequality :<>: (x :<>: y)', () => {
    const expr = parseExpr('x :<>: y');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe(':<>:');
    }
  });

  it('should parse IN (elem IN set)', () => {
    const expr = parseExpr('elem IN set');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe('IN');
    }
  });

  it('should parse LIKE (str LIKE pattern)', () => {
    const expr = parseExpr("str LIKE '%x%'");
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe('LIKE');
    }
  });

  it('should parse concatenation || (a || b)', () => {
    const expr = parseExpr('a || b');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe('||');
    }
  });
});

describe('Unary operators', () => {
  it('should parse NOT x', () => {
    const expr = parseExpr('NOT x');
    expect(expr.type).toBe('UnaryExpression');
    if (expr.type === 'UnaryExpression') {
      expect(expr.operator).toBe('NOT');
    }
  });

  it('should parse -x', () => {
    const expr = parseExpr('-x');
    expect(expr.type).toBe('UnaryExpression');
    if (expr.type === 'UnaryExpression') {
      expect(expr.operator).toBe('-');
    }
  });

  it('should parse NOT NOT x', () => {
    const expr = parseExpr('NOT NOT x');
    expect(expr.type).toBe('UnaryExpression');
    if (expr.type === 'UnaryExpression') {
      expect(expr.operand.type).toBe('UnaryExpression');
    }
  });
});

describe('Parentheses', () => {
  it('should parse (a + b) * c', () => {
    const expr = parseExpr('(a + b) * c');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe('*');
      expect(expr.left.type).toBe('BinaryExpression');
    }
  });
});

describe('QUERY expression', () => {
  it('should parse QUERY(v <* source | condition)', () => {
    const expr = parseExpr('QUERY(v <* items | v > 0)');
    expect(expr.type).toBe('QueryExpression');
    if (expr.type === 'QueryExpression') {
      expect(expr.variable).toBe('v');
    }
  });
});

describe('Aggregate initializer', () => {
  it('should parse empty aggregate []', () => {
    const expr = parseExpr('[]');
    expect(expr.type).toBe('AggregateInitializer');
    if (expr.type === 'AggregateInitializer') {
      expect(expr.elements).toHaveLength(0);
    }
  });

  it('should parse [1, 2, 3]', () => {
    const expr = parseExpr('[1, 2, 3]');
    expect(expr.type).toBe('AggregateInitializer');
    if (expr.type === 'AggregateInitializer') {
      expect(expr.elements).toHaveLength(3);
    }
  });

  it('should parse [a:3, b:2] with repetition', () => {
    const expr = parseExpr('[a:3, b:2]');
    expect(expr.type).toBe('AggregateInitializer');
    if (expr.type === 'AggregateInitializer') {
      expect(expr.elements).toHaveLength(2);
      expect(expr.elements[0]!.repetition).toBeDefined();
    }
  });
});

describe('Interval expression', () => {
  it('should parse {0 <= x < 10}', () => {
    const expr = parseExpr('{0<=x<10}');
    expect(expr.type).toBe('IntervalExpression');
    if (expr.type === 'IntervalExpression') {
      expect(expr.lowOp).toBe('<=');
      expect(expr.highOp).toBe('<');
    }
  });
});

describe('Qualifiers', () => {
  it('should parse entity.attr', () => {
    const expr = parseExpr('entity.attr');
    expect(expr.type).toBe('QualifiedRef');
    if (expr.type === 'QualifiedRef') {
      expect(expr.qualifiers).toHaveLength(1);
      expect(expr.qualifiers[0]!.type).toBe('AttributeRef');
    }
  });

  it('should parse ref\\group', () => {
    const expr = parseExpr('ref\\group');
    expect(expr.type).toBe('QualifiedRef');
    if (expr.type === 'QualifiedRef') {
      expect(expr.qualifiers).toHaveLength(1);
      expect(expr.qualifiers[0]!.type).toBe('GroupRef');
    }
  });

  it('should parse list[1]', () => {
    const expr = parseExpr('list[1]');
    expect(expr.type).toBe('QualifiedRef');
    if (expr.type === 'QualifiedRef') {
      expect(expr.qualifiers).toHaveLength(1);
      expect(expr.qualifiers[0]!.type).toBe('IndexRef');
    }
  });

  it('should parse list[1:3] range', () => {
    const expr = parseExpr('list[1:3]');
    expect(expr.type).toBe('QualifiedRef');
    if (expr.type === 'QualifiedRef') {
      const idx = expr.qualifiers[0]!;
      expect(idx.type).toBe('IndexRef');
      if (idx.type === 'IndexRef') expect(idx.upperIndex).toBeDefined();
    }
  });

  it('should parse chained qualifiers: a.b[1]\\c', () => {
    const expr = parseExpr('a.b[1]\\c');
    expect(expr.type).toBe('QualifiedRef');
    if (expr.type === 'QualifiedRef') {
      expect(expr.qualifiers).toHaveLength(3);
    }
  });

  it('should parse SELF\\entity.attr', () => {
    const expr = parseExpr('SELF\\entity.attr');
    expect(expr.type).toBe('QualifiedRef');
    if (expr.type === 'QualifiedRef') {
      expect(expr.root.type).toBe('SelfRef');
      expect(expr.qualifiers).toHaveLength(2);
    }
  });
});

describe('Binary operators — DIV, MOD, XOR, ANDOR', () => {
  it('should parse DIV', () => {
    const expr = parseExpr('a DIV b');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') expect(expr.operator).toBe('DIV');
  });

  it('should parse MOD', () => {
    const expr = parseExpr('a MOD b');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') expect(expr.operator).toBe('MOD');
  });

  it('should parse XOR', () => {
    const expr = parseExpr('a XOR b');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') expect(expr.operator).toBe('XOR');
  });

  it('should parse ANDOR', () => {
    const expr = parseExpr('a ANDOR b');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') expect(expr.operator).toBe('ANDOR');
  });
});

describe('Complex expressions', () => {
  it('should parse a.b[1] + SIZEOF(QUERY(v <* items | v > 0))', () => {
    const expr = parseExpr('a.b[1] + SIZEOF(QUERY(v <* items | v > 0))');
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type === 'BinaryExpression') {
      expect(expr.operator).toBe('+');
    }
  });
});
