import { buildSchema } from '@step-nc/express-dictionary';
import type { ExpressionNode } from '@step-nc/express-parser';
import { parseExpress } from '@step-nc/express-parser';
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/interpreter/evaluate';
import {
  EVAL_INDETERMINATE,
  type EvalContext,
} from '../../src/interpreter/types';
import { buildTestSchema } from '../fixtures/build-test-schema';

const span = {
  start: { offset: 0, line: 1, column: 1 },
  end: { offset: 0, line: 1, column: 1 },
};

function intLit(value: number): ExpressionNode {
  return { type: 'IntegerLiteral', value, span };
}

function realLit(value: number): ExpressionNode {
  return { type: 'RealLiteral', value, span };
}

function callExpr(name: string, args: ExpressionNode[]): ExpressionNode {
  return { type: 'FunctionCallExpression', name, args, span };
}

describe('User-Defined Function Evaluation', () => {
  it('circle_area(1.0) should return PI', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(callExpr('circle_area', [realLit(1.0)]), ctx);
    expect(typeof result).toBe('number');
    expect(result as number).toBeCloseTo(3.14159265358979, 5);
  });

  it('circle_area(2.0) should return 4*PI', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(callExpr('circle_area', [realLit(2.0)]), ctx);
    expect(result as number).toBeCloseTo(4 * 3.14159265358979, 5);
  });

  it('clamp(5.0, 0.0, 10.0) should return 5.0', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(
      callExpr('clamp', [realLit(5.0), realLit(0.0), realLit(10.0)]),
      ctx,
    );
    expect(result).toBe(5.0);
  });

  it('clamp(-1.0, 0.0, 10.0) should return 0.0 (lower clamp)', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(
      callExpr('clamp', [realLit(-1.0), realLit(0.0), realLit(10.0)]),
      ctx,
    );
    expect(result).toBe(0.0);
  });

  it('clamp(15.0, 0.0, 10.0) should return 10.0 (upper clamp)', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(
      callExpr('clamp', [realLit(15.0), realLit(0.0), realLit(10.0)]),
      ctx,
    );
    expect(result).toBe(10.0);
  });

  it('factorial(5) should return 120', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(callExpr('factorial', [intLit(5)]), ctx);
    expect(result).toBe(120);
  });

  it('factorial(0) should return 1', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(callExpr('factorial', [intLit(0)]), ctx);
    expect(result).toBe(1);
  });

  it('grade(10) should return "A"', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(callExpr('grade', [intLit(10)]), ctx);
    expect(result).toBe('A');
  });

  it('grade(9) should return "B"', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(callExpr('grade', [intLit(9)]), ctx);
    expect(result).toBe('B');
  });

  it('grade(1) should return "C" (otherwise branch)', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(callExpr('grade', [intLit(1)]), ctx);
    expect(result).toBe('C');
  });

  it('function without RETURN should return EVAL_INDETERMINATE', () => {
    // Inline schema with a function that falls off the end
    const source = `
      SCHEMA NO_RETURN_SCHEMA;
        FUNCTION no_return(x : INTEGER) : INTEGER;
          IF x > 0 THEN
            -- intentionally no RETURN here
          END_IF;
        END_FUNCTION;
      END_SCHEMA;
    `;
    const { ast } = parseExpress(source);
    if (ast.type !== 'SchemaDeclaration') throw new Error('parse failed');
    const { schema } = buildSchema(ast);
    const ctx: EvalContext = { schema };
    const result = evaluate(callExpr('no_return', [intLit(1)]), ctx);
    expect(result).toBe(EVAL_INDETERMINATE);
  });

  it('FunctionDefinition without body should return EVAL_INDETERMINATE', () => {
    // Manually construct a schema with a function definition but no body
    const source = `
      SCHEMA EMPTY_BODY_SCHEMA;
        FUNCTION stub(x : REAL) : REAL;
        END_FUNCTION;
      END_SCHEMA;
    `;
    const { ast } = parseExpress(source);
    if (ast.type !== 'SchemaDeclaration') throw new Error('parse failed');
    const { schema } = buildSchema(ast);
    // The function body is empty (no statements), so body=undefined in FunctionDefinition
    const ctx: EvalContext = { schema };
    const result = evaluate(callExpr('stub', [realLit(1.0)]), ctx);
    expect(result).toBe(EVAL_INDETERMINATE);
  });

  it('parameters are bound correctly (order matters)', () => {
    // clamp with wrong order: clamp(hi=0, lo=10, val=5) → val=0 out of lo=10 range → 10
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(
      callExpr('clamp', [realLit(0.0), realLit(10.0), realLit(5.0)]),
      ctx,
    );
    // val=0.0, lo=10.0, hi=5.0 → val < lo → returns lo = 10.0
    expect(result).toBe(10.0);
  });
});

describe('Recursion depth limit', () => {
  it('recursive_factorial(5) should return 120', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(callExpr('recursive_factorial', [intLit(5)]), ctx);
    expect(result).toBe(120);
  });

  it('recursive_factorial(0) should return 1', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const result = evaluate(callExpr('recursive_factorial', [intLit(0)]), ctx);
    expect(result).toBe(1);
  });

  it('should throw EvalError when recursion exceeds MAX_CALL_DEPTH', () => {
    const source = `
      SCHEMA INFINITE_RECURSE;
        FUNCTION inf_loop(x : INTEGER) : INTEGER;
          RETURN(inf_loop(x));
        END_FUNCTION;
      END_SCHEMA;
    `;
    const { ast } = parseExpress(source);
    if (ast.type !== 'SchemaDeclaration') throw new Error('parse failed');
    const { schema } = buildSchema(ast);
    const ctx: EvalContext = { schema };
    expect(() => evaluate(callExpr('inf_loop', [intLit(1)]), ctx)).toThrow(
      /Maximum call depth.*exceeded/,
    );
  });

  it('callDepth should reset between independent calls', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    evaluate(callExpr('recursive_factorial', [intLit(10)]), ctx);
    const result = evaluate(callExpr('recursive_factorial', [intLit(10)]), ctx);
    expect(result).toBe(3628800);
  });
});

describe('REPEAT FOR+WHILE and FOR+UNTIL', () => {
  it('FOR+WHILE should stop when WHILE condition becomes false', () => {
    const source = `
      SCHEMA FOR_WHILE_SCHEMA;
        FUNCTION sum_while(n : INTEGER) : INTEGER;
          LOCAL acc : INTEGER := 0; END_LOCAL;
          REPEAT i := 1 TO n WHILE (acc < 50);
            acc := acc + i;
          END_REPEAT;
          RETURN(acc);
        END_FUNCTION;
      END_SCHEMA;
    `;
    const { ast } = parseExpress(source);
    if (ast.type !== 'SchemaDeclaration') throw new Error('parse failed');
    const { schema } = buildSchema(ast);
    const ctx: EvalContext = { schema };

    // acc accumulates: 1, 3, 6, 10, 15, 21, 28, 36, 45, 55
    // At i=10: acc before body = 45 < 50 → WHILE true → acc becomes 55
    // At i=11: acc = 55 >= 50 → WHILE false → break
    const result = evaluate(callExpr('sum_while', [intLit(100)]), ctx);
    expect(result).toBe(55);
  });

  it('FOR+UNTIL should stop when UNTIL condition becomes true', () => {
    const source = `
      SCHEMA FOR_UNTIL_SCHEMA;
        FUNCTION sum_until(n : INTEGER) : INTEGER;
          LOCAL acc : INTEGER := 0; END_LOCAL;
          REPEAT i := 1 TO n UNTIL (acc > 20);
            acc := acc + i;
          END_REPEAT;
          RETURN(acc);
        END_FUNCTION;
      END_SCHEMA;
    `;
    const { ast } = parseExpress(source);
    if (ast.type !== 'SchemaDeclaration') throw new Error('parse failed');
    const { schema } = buildSchema(ast);
    const ctx: EvalContext = { schema };

    // acc: 1, 3, 6, 10, 15, 21 → after i=6: acc=21 > 20 → UNTIL true → break
    const result = evaluate(callExpr('sum_until', [intLit(100)]), ctx);
    expect(result).toBe(21);
  });

  it('pure FOR loop should still work (no regression)', () => {
    const source = `
      SCHEMA PURE_FOR_SCHEMA;
        FUNCTION sum_n(n : INTEGER) : INTEGER;
          LOCAL acc : INTEGER := 0; END_LOCAL;
          REPEAT i := 1 TO n;
            acc := acc + i;
          END_REPEAT;
          RETURN(acc);
        END_FUNCTION;
      END_SCHEMA;
    `;
    const { ast } = parseExpress(source);
    if (ast.type !== 'SchemaDeclaration') throw new Error('parse failed');
    const { schema } = buildSchema(ast);
    const ctx: EvalContext = { schema };

    const result = evaluate(callExpr('sum_n', [intLit(10)]), ctx);
    expect(result).toBe(55);
  });
});

describe('Nested function evaluation', () => {
  it('should resolve and call a nested function', () => {
    const source = `
      SCHEMA NESTED_FN_SCHEMA;
        FUNCTION outer(x : REAL) : REAL;
          FUNCTION inner(y : REAL) : REAL;
            RETURN(y * 2.0);
          END_FUNCTION;
          RETURN(inner(x) + 1.0);
        END_FUNCTION;
      END_SCHEMA;
    `;
    const { ast } = parseExpress(source);
    if (ast.type !== 'SchemaDeclaration') throw new Error('parse failed');
    const { schema } = buildSchema(ast);
    const ctx: EvalContext = { schema };

    const result = evaluate(callExpr('outer', [realLit(5.0)]), ctx);
    expect(result).toBe(11.0);
  });

  it('nested function uses its own parameters (not parent scope)', () => {
    const source = `
      SCHEMA NESTED_SCOPE_SCHEMA;
        FUNCTION compute(a : INTEGER) : INTEGER;
          FUNCTION helper(b : INTEGER) : INTEGER;
            RETURN(b + 10);
          END_FUNCTION;
          RETURN(helper(a));
        END_FUNCTION;
      END_SCHEMA;
    `;
    const { ast } = parseExpress(source);
    if (ast.type !== 'SchemaDeclaration') throw new Error('parse failed');
    const { schema } = buildSchema(ast);
    const ctx: EvalContext = { schema };

    const result = evaluate(callExpr('compute', [intLit(3)]), ctx);
    expect(result).toBe(13);
  });

  it('schema-level functions should propagate localDeclarations to context', () => {
    const source = `
      SCHEMA PROPAGATE_SCHEMA;
        FUNCTION wrapper(x : REAL) : REAL;
          FUNCTION double(y : REAL) : REAL;
            RETURN(y * 2.0);
          END_FUNCTION;
          LOCAL temp : REAL := double(x); END_LOCAL;
          RETURN(temp + 0.5);
        END_FUNCTION;
      END_SCHEMA;
    `;
    const { ast } = parseExpress(source);
    if (ast.type !== 'SchemaDeclaration') throw new Error('parse failed');
    const { schema } = buildSchema(ast);
    const ctx: EvalContext = { schema };

    const result = evaluate(callExpr('wrapper', [realLit(3.0)]), ctx);
    expect(result).toBe(6.5);
  });
});
