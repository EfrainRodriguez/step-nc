import type { ExpressionNode } from '@step-nc/express-parser';
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/interpreter/evaluate';
import {
  EVAL_INDETERMINATE,
  EvalError,
  type EvalContext,
} from '../../src/interpreter/types';
import type { EntityInstance } from '../../src/types/instance';
import { buildTestSchema } from '../fixtures/build-test-schema';

const span = {
  start: { offset: 0, line: 1, column: 1 },
  end: { offset: 0, line: 1, column: 1 },
};

function realLit(value: number): ExpressionNode {
  return { type: 'RealLiteral', value, span };
}

function strLit(value: string): ExpressionNode {
  return { type: 'StringLiteral', value, span };
}

function entityConstructor(
  entity: string,
  args: ExpressionNode[],
): ExpressionNode {
  return { type: 'EntityConstructor', entity, args, span };
}

function qualifiedRef(root: ExpressionNode, attrName: string): ExpressionNode {
  return {
    type: 'QualifiedRef',
    root,
    qualifiers: [{ type: 'AttributeRef', name: attrName, span }],
    span,
  };
}

function isEntityInstance(val: unknown): val is EntityInstance {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'definition' in val &&
    'attributes' in val
  );
}

describe('EntityConstructor Evaluation', () => {
  it('constructs a temporary colour_rgb instance with correct attributes', () => {
    // colour_rgb has: red, green, blue (all REAL, no inheritance)
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };

    const expr = entityConstructor('colour_rgb', [
      realLit(1.0),
      realLit(0.5),
      realLit(0.0),
    ]);
    const result = evaluate(expr, ctx);

    expect(isEntityInstance(result)).toBe(true);
    const inst = result as EntityInstance;
    expect(inst.id).toBe(0); // temporary — id=0
    expect(inst.typeName).toBe('COLOUR_RGB');
    expect(inst.attributes.get('RED')).toBe(1.0);
    expect(inst.attributes.get('GREEN')).toBe(0.5);
    expect(inst.attributes.get('BLUE')).toBe(0.0);
  });

  it('temporary instance has empty _derivedCache', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const expr = entityConstructor('colour_rgb', [
      realLit(1.0),
      realLit(0.0),
      realLit(0.0),
    ]);
    const result = evaluate(expr, ctx) as EntityInstance;
    expect(result._derivedCache).toBeInstanceOf(Map);
    expect(result._derivedCache.size).toBe(0);
  });

  it('throws EvalError for unknown entity', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const expr = entityConstructor('non_existent_entity', [realLit(1.0)]);
    expect(() => evaluate(expr, ctx)).toThrow(EvalError);
    expect(() => evaluate(expr, ctx)).toThrow(
      "unknown entity 'non_existent_entity'",
    );
  });

  it('throws EvalError for wrong number of arguments', () => {
    // colour_rgb expects 3 args (red, green, blue)
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const expr = entityConstructor('colour_rgb', [realLit(1.0)]); // only 1 arg
    expect(() => evaluate(expr, ctx)).toThrow(EvalError);
    expect(() => evaluate(expr, ctx)).toThrow('expected 3 arguments, got 1');
  });

  it('attribute access via QualifiedRef on temporary instance', () => {
    // Build: colour_rgb(0.8, 0.2, 0.4).green → 0.2
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };

    const constructorExpr = entityConstructor('colour_rgb', [
      realLit(0.8),
      realLit(0.2),
      realLit(0.4),
    ]);

    const accessExpr = qualifiedRef(constructorExpr, 'GREEN');
    const result = evaluate(accessExpr, ctx);
    expect(result).toBe(0.2);
  });

  it('returns EVAL_INDETERMINATE for attribute of unknown type from temporary instance', () => {
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };

    const constructorExpr = entityConstructor('colour_rgb', [
      realLit(1.0),
      realLit(1.0),
      realLit(1.0),
    ]);
    const accessExpr = qualifiedRef(constructorExpr, 'NON_EXISTENT_ATTR');
    const result = evaluate(accessExpr, ctx);
    expect(result).toBe(EVAL_INDETERMINATE);
  });

  it('constructs named_unit with string attributes', () => {
    // named_unit: name STRING, symbol STRING
    const schema = buildTestSchema();
    const ctx: EvalContext = { schema };
    const expr = entityConstructor('named_unit', [
      strLit('millimetre'),
      strLit('mm'),
    ]);
    const result = evaluate(expr, ctx) as EntityInstance;
    expect(isEntityInstance(result)).toBe(true);
    expect(result.attributes.get('NAME')).toBe('millimetre');
    expect(result.attributes.get('SYMBOL')).toBe('mm');
  });
});
