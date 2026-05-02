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
import { buildTestSchema } from '../fixtures/build-test-schema';

function makeCtx(overrides?: Partial<EvalContext>): EvalContext {
  return {
    schema: buildTestSchema(),
    ...overrides,
  };
}

function intLit(value: number): ExpressionNode {
  return {
    type: 'IntegerLiteral',
    value,
    span: {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 0, line: 1, column: 1 },
    },
  };
}

function realLit(value: number): ExpressionNode {
  return {
    type: 'RealLiteral',
    value,
    span: {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 0, line: 1, column: 1 },
    },
  };
}

function strLit(value: string): ExpressionNode {
  return {
    type: 'StringLiteral',
    value,
    span: {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 0, line: 1, column: 1 },
    },
  };
}

function logicalLit(value: 'TRUE' | 'FALSE' | 'UNKNOWN'): ExpressionNode {
  return {
    type: 'LogicalLiteral',
    value,
    span: {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 0, line: 1, column: 1 },
    },
  };
}

function binaryExpr(
  left: ExpressionNode,
  op: string,
  right: ExpressionNode,
): ExpressionNode {
  return {
    type: 'BinaryExpression',
    operator: op as import('@step-nc/express-parser').BinaryOperator,
    left,
    right,
    span: {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 0, line: 1, column: 1 },
    },
  };
}

function unaryExpr(op: string, operand: ExpressionNode): ExpressionNode {
  return {
    type: 'UnaryExpression',
    operator: op as import('@step-nc/express-parser').UnaryOperator,
    operand,
    span: {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 0, line: 1, column: 1 },
    },
  };
}

const span = {
  start: { offset: 0, line: 1, column: 1 },
  end: { offset: 0, line: 1, column: 1 },
};

describe('Expression Interpreter — Core', () => {
  const ctx = makeCtx();

  describe('Literals', () => {
    it('should evaluate integer literal', () => {
      expect(evaluate(intLit(42), ctx)).toBe(42);
    });

    it('should evaluate real literal', () => {
      expect(evaluate(realLit(3.14), ctx)).toBe(3.14);
    });

    it('should evaluate string literal', () => {
      expect(evaluate(strLit('hello'), ctx)).toBe('hello');
    });

    it('should evaluate logical TRUE', () => {
      expect(evaluate(logicalLit('TRUE'), ctx)).toBe(true);
    });

    it('should evaluate logical FALSE', () => {
      expect(evaluate(logicalLit('FALSE'), ctx)).toBe(false);
    });

    it('should evaluate logical UNKNOWN as INDETERMINATE', () => {
      expect(evaluate(logicalLit('UNKNOWN'), ctx)).toBe(EVAL_INDETERMINATE);
    });

    it('should evaluate INDETERMINATE literal', () => {
      const expr: ExpressionNode = { type: 'IndeterminateLiteral', span };
      expect(evaluate(expr, ctx)).toBe(EVAL_INDETERMINATE);
    });

    it('should evaluate enum ref', () => {
      const expr: ExpressionNode = {
        type: 'EnumRef',
        enumValue: 'AXIS2_2D',
        span,
      };
      expect(evaluate(expr, ctx)).toBe('AXIS2_2D');
    });
  });

  describe('Arithmetic', () => {
    it('should add two integers', () => {
      expect(evaluate(binaryExpr(intLit(3), '+', intLit(4)), ctx)).toBe(7);
    });

    it('should subtract', () => {
      expect(evaluate(binaryExpr(intLit(10), '-', intLit(3)), ctx)).toBe(7);
    });

    it('should multiply', () => {
      expect(evaluate(binaryExpr(intLit(5), '*', intLit(6)), ctx)).toBe(30);
    });

    it('should divide (real division)', () => {
      expect(evaluate(binaryExpr(intLit(7), '/', intLit(2)), ctx)).toBe(3.5);
    });

    it('should perform DIV (integer division)', () => {
      expect(evaluate(binaryExpr(intLit(7), 'DIV', intLit(2)), ctx)).toBe(3);
    });

    it('should perform MOD', () => {
      expect(evaluate(binaryExpr(intLit(7), 'MOD', intLit(3)), ctx)).toBe(1);
    });

    it('should exponentiate', () => {
      expect(evaluate(binaryExpr(intLit(2), '**', intLit(10)), ctx)).toBe(1024);
    });

    it('should return INDETERMINATE for division by zero', () => {
      expect(evaluate(binaryExpr(intLit(5), '/', intLit(0)), ctx)).toBe(
        EVAL_INDETERMINATE,
      );
    });
  });

  describe('Comparisons', () => {
    it('should evaluate = (true)', () => {
      expect(evaluate(binaryExpr(intLit(5), '=', intLit(5)), ctx)).toBe(true);
    });

    it('should evaluate = (false)', () => {
      expect(evaluate(binaryExpr(intLit(5), '=', intLit(3)), ctx)).toBe(false);
    });

    it('should evaluate <>', () => {
      expect(evaluate(binaryExpr(intLit(5), '<>', intLit(3)), ctx)).toBe(true);
    });

    it('should evaluate <', () => {
      expect(evaluate(binaryExpr(intLit(3), '<', intLit(5)), ctx)).toBe(true);
    });

    it('should evaluate >', () => {
      expect(evaluate(binaryExpr(intLit(5), '>', intLit(3)), ctx)).toBe(true);
    });

    it('should evaluate <=', () => {
      expect(evaluate(binaryExpr(intLit(5), '<=', intLit(5)), ctx)).toBe(true);
    });

    it('should evaluate >=', () => {
      expect(evaluate(binaryExpr(intLit(5), '>=', intLit(3)), ctx)).toBe(true);
    });

    it('should compare strings', () => {
      expect(evaluate(binaryExpr(strLit('abc'), '=', strLit('abc')), ctx)).toBe(
        true,
      );
      expect(evaluate(binaryExpr(strLit('abc'), '<', strLit('def')), ctx)).toBe(
        true,
      );
    });
  });

  describe('Logical operators (three-valued)', () => {
    it('AND: TRUE AND TRUE = TRUE', () => {
      expect(
        evaluate(
          binaryExpr(logicalLit('TRUE'), 'AND', logicalLit('TRUE')),
          ctx,
        ),
      ).toBe(true);
    });

    it('AND: TRUE AND FALSE = FALSE', () => {
      expect(
        evaluate(
          binaryExpr(logicalLit('TRUE'), 'AND', logicalLit('FALSE')),
          ctx,
        ),
      ).toBe(false);
    });

    it('AND: TRUE AND UNKNOWN = INDETERMINATE', () => {
      expect(
        evaluate(
          binaryExpr(logicalLit('TRUE'), 'AND', logicalLit('UNKNOWN')),
          ctx,
        ),
      ).toBe(EVAL_INDETERMINATE);
    });

    it('AND: FALSE AND UNKNOWN = FALSE', () => {
      expect(
        evaluate(
          binaryExpr(logicalLit('FALSE'), 'AND', logicalLit('UNKNOWN')),
          ctx,
        ),
      ).toBe(false);
    });

    it('OR: FALSE OR TRUE = TRUE', () => {
      expect(
        evaluate(
          binaryExpr(logicalLit('FALSE'), 'OR', logicalLit('TRUE')),
          ctx,
        ),
      ).toBe(true);
    });

    it('OR: FALSE OR FALSE = FALSE', () => {
      expect(
        evaluate(
          binaryExpr(logicalLit('FALSE'), 'OR', logicalLit('FALSE')),
          ctx,
        ),
      ).toBe(false);
    });

    it('OR: FALSE OR UNKNOWN = INDETERMINATE', () => {
      expect(
        evaluate(
          binaryExpr(logicalLit('FALSE'), 'OR', logicalLit('UNKNOWN')),
          ctx,
        ),
      ).toBe(EVAL_INDETERMINATE);
    });

    it('XOR: TRUE XOR FALSE = TRUE', () => {
      expect(
        evaluate(
          binaryExpr(logicalLit('TRUE'), 'XOR', logicalLit('FALSE')),
          ctx,
        ),
      ).toBe(true);
    });

    it('XOR: TRUE XOR TRUE = FALSE', () => {
      expect(
        evaluate(
          binaryExpr(logicalLit('TRUE'), 'XOR', logicalLit('TRUE')),
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('Unary operators', () => {
    it('should negate a number', () => {
      expect(evaluate(unaryExpr('-', intLit(42)), ctx)).toBe(-42);
    });

    it('should apply unary +', () => {
      expect(evaluate(unaryExpr('+', intLit(42)), ctx)).toBe(42);
    });

    it('NOT TRUE = FALSE', () => {
      expect(evaluate(unaryExpr('NOT', logicalLit('TRUE')), ctx)).toBe(false);
    });

    it('NOT FALSE = TRUE', () => {
      expect(evaluate(unaryExpr('NOT', logicalLit('FALSE')), ctx)).toBe(true);
    });
  });

  describe('String concatenation', () => {
    it('should concatenate strings with ||', () => {
      expect(
        evaluate(binaryExpr(strLit('hello'), '||', strLit(' world')), ctx),
      ).toBe('hello world');
    });
  });

  describe('IN operator', () => {
    it('should return true when element is in aggregate', () => {
      const agg: ExpressionNode = {
        type: 'AggregateInitializer',
        elements: [
          { type: 'AggregateElement', value: intLit(1), span },
          { type: 'AggregateElement', value: intLit(2), span },
          { type: 'AggregateElement', value: intLit(3), span },
        ],
        span,
      };
      expect(evaluate(binaryExpr(intLit(2), 'IN', agg), ctx)).toBe(true);
    });

    it('should return false when element is not in aggregate', () => {
      const agg: ExpressionNode = {
        type: 'AggregateInitializer',
        elements: [
          { type: 'AggregateElement', value: intLit(1), span },
          { type: 'AggregateElement', value: intLit(2), span },
        ],
        span,
      };
      expect(evaluate(binaryExpr(intLit(5), 'IN', agg), ctx)).toBe(false);
    });
  });

  describe('IntervalExpression', () => {
    it('should evaluate {1 <= 3 < 5} as true', () => {
      const expr: ExpressionNode = {
        type: 'IntervalExpression',
        low: intLit(1),
        lowOp: '<=',
        value: intLit(3),
        highOp: '<',
        high: intLit(5),
        span,
      };
      expect(evaluate(expr, ctx)).toBe(true);
    });

    it('should evaluate {1 <= 5 < 5} as false', () => {
      const expr: ExpressionNode = {
        type: 'IntervalExpression',
        low: intLit(1),
        lowOp: '<=',
        value: intLit(5),
        highOp: '<',
        high: intLit(5),
        span,
      };
      expect(evaluate(expr, ctx)).toBe(false);
    });
  });

  describe('AggregateInitializer', () => {
    it('should evaluate aggregate initializer', () => {
      const expr: ExpressionNode = {
        type: 'AggregateInitializer',
        elements: [
          { type: 'AggregateElement', value: intLit(10), span },
          { type: 'AggregateElement', value: intLit(20), span },
        ],
        span,
      };
      expect(evaluate(expr, ctx)).toEqual([10, 20]);
    });

    it('should handle repetition syntax (element : count)', () => {
      const expr: ExpressionNode = {
        type: 'AggregateInitializer',
        elements: [
          {
            type: 'AggregateElement',
            value: realLit(0.0),
            repetition: intLit(3),
            span,
          },
        ],
        span,
      };
      expect(evaluate(expr, ctx)).toEqual([0.0, 0.0, 0.0]);
    });
  });

  describe('SelfRef and attribute access', () => {
    it('should resolve SELF to the current instance', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);
      const { instance } = model.createInstance('cartesian_point');
      if (!instance) throw new Error('createInstance failed');
      setAttribute(instance, 'name', 'Origin');
      setAttribute(instance, 'coordinates', createList([1.0, 2.0, 3.0]));

      const selfExpr: ExpressionNode = { type: 'SelfRef', span };
      const selfCtx = makeCtx({ self: instance, model });
      const result = evaluate(selfExpr, selfCtx);
      expect(result).toBe(instance);
    });

    it('should throw when SELF is used outside instance context', () => {
      const selfExpr: ExpressionNode = { type: 'SelfRef', span };
      expect(() => evaluate(selfExpr, makeCtx())).toThrow('SELF');
    });

    it('should resolve SELF.attribute via QualifiedRef', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);
      const { instance } = model.createInstance('cartesian_point');
      if (!instance) throw new Error('createInstance failed');
      setAttribute(instance, 'name', 'Origin');
      setAttribute(instance, 'coordinates', createList([1.0, 2.0, 3.0]));

      const expr: ExpressionNode = {
        type: 'QualifiedRef',
        root: { type: 'SelfRef', span },
        qualifiers: [{ type: 'AttributeRef', name: 'NAME', span }],
        span,
      };
      const result = evaluate(expr, makeCtx({ self: instance, model }));
      expect(result).toBe('Origin');
    });

    it('should resolve IdentifierRef as attribute on SELF', () => {
      const schema = buildTestSchema();
      const model = new StepModel(schema);
      const { instance } = model.createInstance('cartesian_point');
      if (!instance) throw new Error('createInstance failed');
      setAttribute(instance, 'name', 'MyPoint');

      const expr: ExpressionNode = {
        type: 'IdentifierRef',
        name: 'name',
        span,
      };
      const result = evaluate(expr, makeCtx({ self: instance, model }));
      expect(result).toBe('MyPoint');
    });
  });
});
