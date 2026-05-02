import type { ExpressionNode } from '@step-nc/express-parser';
import { describe, expect, it } from 'vitest';
import { createList } from '../../src/aggregations/step-list';
import { setAttribute } from '../../src/attributes/attribute-access';
import { evaluate } from '../../src/interpreter/evaluate';
import {
  EVAL_INDETERMINATE,
  type EvalContext,
} from '../../src/interpreter/types';
import { StepModel } from '../../src/model/step-model';
import { createRef } from '../../src/references/reference-resolver';
import { buildTestSchema } from '../fixtures/build-test-schema';

const span = {
  start: { offset: 0, line: 1, column: 1 },
  end: { offset: 0, line: 1, column: 1 },
};

function makeCtx(overrides?: Partial<EvalContext>): EvalContext {
  return {
    schema: buildTestSchema(),
    ...overrides,
  };
}

function fnCall(name: string, args: ExpressionNode[]): ExpressionNode {
  return {
    type: 'FunctionCallExpression',
    name,
    args,
    span,
  };
}

function intLit(value: number): ExpressionNode {
  return { type: 'IntegerLiteral', value, span };
}

function realLit(value: number): ExpressionNode {
  return { type: 'RealLiteral', value, span };
}

function strLit(value: string): ExpressionNode {
  return { type: 'StringLiteral', value, span };
}

describe('Expression Interpreter — Built-in Functions', () => {
  const ctx = makeCtx();

  describe('Math functions', () => {
    it('ABS(-5) = 5', () => {
      expect(evaluate(fnCall('ABS', [intLit(-5)]), ctx)).toBe(5);
    });

    it('ABS(3) = 3', () => {
      expect(evaluate(fnCall('ABS', [intLit(3)]), ctx)).toBe(3);
    });

    it('SQRT(4.0) = 2.0', () => {
      expect(evaluate(fnCall('SQRT', [realLit(4.0)]), ctx)).toBe(2.0);
    });

    it('SQRT(-1) returns INDETERMINATE', () => {
      expect(evaluate(fnCall('SQRT', [intLit(-1)]), ctx)).toBe(
        EVAL_INDETERMINATE,
      );
    });

    it('SIN(0) = 0', () => {
      expect(evaluate(fnCall('SIN', [intLit(0)]), ctx)).toBe(0);
    });

    it('COS(0) = 1', () => {
      expect(evaluate(fnCall('COS', [intLit(0)]), ctx)).toBe(1);
    });

    it('TAN(0) = 0', () => {
      expect(evaluate(fnCall('TAN', [intLit(0)]), ctx)).toBeCloseTo(0);
    });

    it('EXP(0) = 1', () => {
      expect(evaluate(fnCall('EXP', [intLit(0)]), ctx)).toBe(1);
    });

    it('LOG(1) = 0', () => {
      expect(evaluate(fnCall('LOG', [intLit(1)]), ctx)).toBe(0);
    });

    it('LOG2(8) = 3', () => {
      expect(evaluate(fnCall('LOG2', [intLit(8)]), ctx)).toBe(3);
    });

    it('LOG10(100) = 2', () => {
      expect(evaluate(fnCall('LOG10', [intLit(100)]), ctx)).toBe(2);
    });

    it('EXP(1) ≈ E', () => {
      expect(evaluate(fnCall('EXP', [intLit(1)]), ctx)).toBeCloseTo(Math.E);
    });
  });

  describe('EXISTS / NVL', () => {
    it('EXISTS(5) = TRUE', () => {
      expect(evaluate(fnCall('EXISTS', [intLit(5)]), ctx)).toBe(true);
    });

    it('EXISTS(?) = FALSE', () => {
      const expr = fnCall('EXISTS', [{ type: 'IndeterminateLiteral', span }]);
      expect(evaluate(expr, ctx)).toBe(false);
    });

    it('NVL(5, 0) = 5', () => {
      expect(evaluate(fnCall('NVL', [intLit(5), intLit(0)]), ctx)).toBe(5);
    });

    it('NVL(?, 0) = 0', () => {
      const expr = fnCall('NVL', [
        { type: 'IndeterminateLiteral', span },
        intLit(0),
      ]);
      expect(evaluate(expr, ctx)).toBe(0);
    });
  });

  describe('Aggregate functions', () => {
    it('SIZEOF([1, 2, 3]) = 3', () => {
      const agg: ExpressionNode = {
        type: 'AggregateInitializer',
        elements: [
          { type: 'AggregateElement', value: intLit(1), span },
          { type: 'AggregateElement', value: intLit(2), span },
          { type: 'AggregateElement', value: intLit(3), span },
        ],
        span,
      };
      expect(evaluate(fnCall('SIZEOF', [agg]), ctx)).toBe(3);
    });

    it('HIINDEX([1, 2, 3]) = 3', () => {
      const agg: ExpressionNode = {
        type: 'AggregateInitializer',
        elements: [
          { type: 'AggregateElement', value: intLit(1), span },
          { type: 'AggregateElement', value: intLit(2), span },
          { type: 'AggregateElement', value: intLit(3), span },
        ],
        span,
      };
      expect(evaluate(fnCall('HIINDEX', [agg]), ctx)).toBe(3);
    });

    it('LOINDEX([1, 2, 3]) = 1', () => {
      const agg: ExpressionNode = {
        type: 'AggregateInitializer',
        elements: [{ type: 'AggregateElement', value: intLit(1), span }],
        span,
      };
      expect(evaluate(fnCall('LOINDEX', [agg]), ctx)).toBe(1);
    });
  });

  describe('String functions', () => {
    it('LENGTH("hello") = 5', () => {
      expect(evaluate(fnCall('LENGTH', [strLit('hello')]), ctx)).toBe(5);
    });

    it('VALUE("42") = 42', () => {
      expect(evaluate(fnCall('VALUE', [strLit('42')]), ctx)).toBe(42);
    });

    it('VALUE("abc") returns INDETERMINATE', () => {
      expect(evaluate(fnCall('VALUE', [strLit('abc')]), ctx)).toBe(
        EVAL_INDETERMINATE,
      );
    });
  });

  describe('ODD', () => {
    it('ODD(3) = TRUE', () => {
      expect(evaluate(fnCall('ODD', [intLit(3)]), ctx)).toBe(true);
    });

    it('ODD(4) = FALSE', () => {
      expect(evaluate(fnCall('ODD', [intLit(4)]), ctx)).toBe(false);
    });
  });

  describe('TYPEOF', () => {
    it('TYPEOF(5) includes INTEGER', () => {
      const result = evaluate(fnCall('TYPEOF', [intLit(5)]), ctx);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('INTEGER');
    });

    it('TYPEOF(3.14) includes REAL', () => {
      const result = evaluate(fnCall('TYPEOF', [realLit(3.14)]), ctx);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('REAL');
    });

    it('TYPEOF("hello") includes STRING', () => {
      const result = evaluate(fnCall('TYPEOF', [strLit('hello')]), ctx);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('STRING');
    });
  });

  describe('QUERY expression', () => {
    it('QUERY(x <* [1,2,3,4,5] | x > 3) returns [4, 5]', () => {
      const queryExpr: ExpressionNode = {
        type: 'QueryExpression',
        variable: 'x',
        source: {
          type: 'AggregateInitializer',
          elements: [
            { type: 'AggregateElement', value: intLit(1), span },
            { type: 'AggregateElement', value: intLit(2), span },
            { type: 'AggregateElement', value: intLit(3), span },
            { type: 'AggregateElement', value: intLit(4), span },
            { type: 'AggregateElement', value: intLit(5), span },
          ],
          span,
        },
        condition: {
          type: 'BinaryExpression',
          operator: '>',
          left: { type: 'IdentifierRef', name: 'x', span },
          right: intLit(3),
          span,
        },
        span,
      };
      const queryCtx = makeCtx();
      const result = evaluate(queryExpr, queryCtx);
      expect(result).toEqual([4, 5]);
    });
  });

  describe('USEDIN', () => {
    it('should find instances referencing a target', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);

      const { instance: pt } = model.createInstance('cartesian_point');
      setAttribute(pt!, 'name', 'P1');
      setAttribute(pt!, 'coordinates', createList([1, 2, 3]));

      const { instance: dir } = model.createInstance('direction');
      setAttribute(dir!, 'name', 'D1');
      setAttribute(dir!, 'direction_ratios', createList([1, 0, 0]));

      const { instance: line } = model.createInstance('line');
      setAttribute(line!, 'name', 'L1');
      setAttribute(line!, 'pnt', createRef(pt!.id, 'CARTESIAN_POINT'));
      setAttribute(line!, 'dir', createRef(dir!.id, 'DIRECTION'));

      const usedinExpr = fnCall('USEDIN', [
        { type: 'SelfRef', span },
        strLit(''),
      ]);
      const usedinCtx: EvalContext = {
        schema,
        model,
        self: pt!,
      };
      const result = evaluate(usedinExpr, usedinCtx);
      expect(Array.isArray(result)).toBe(true);
      expect((result as unknown[]).length).toBeGreaterThanOrEqual(1);
    });
  });
});
