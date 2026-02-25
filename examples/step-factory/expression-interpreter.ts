import type { ExpressionNode } from '@step-nc/express-parser';
import { evaluate, type EvalContext } from '@step-nc/step-factory';
import { loadGeometryWithRulesSchema } from './load-schema';

const span = {
  start: { offset: 0, line: 1, column: 1 },
  end: { offset: 0, line: 1, column: 1 },
};

function fnCall(name: string, args: ExpressionNode[]): ExpressionNode {
  return { type: 'FunctionCallExpression', name, args, span };
}

function intLit(value: number): ExpressionNode {
  return { type: 'IntegerLiteral', value, span };
}

const SEP = '─'.repeat(50);

console.log(SEP);
console.log('Expression interpreter');
console.log(SEP);

const schema = loadGeometryWithRulesSchema();
const ctx: EvalContext = { schema };

// Literal and built-in
console.log('evaluate(ABS(-3)):', evaluate(fnCall('ABS', [intLit(-3)]), ctx));

const agg: ExpressionNode = {
  type: 'AggregateInitializer',
  elements: [
    { type: 'AggregateElement', value: intLit(1), span },
    { type: 'AggregateElement', value: intLit(2), span },
    { type: 'AggregateElement', value: intLit(3), span },
  ],
  span,
};
console.log(
  'evaluate(SIZEOF([1,2,3])):',
  evaluate(fnCall('SIZEOF', [agg]), ctx),
);

// QUERY: elements > 2
const queryExpr: ExpressionNode = {
  type: 'QueryExpression',
  variable: 'x',
  source: agg,
  condition: {
    type: 'BinaryExpression',
    operator: '>',
    left: { type: 'IdentifierRef', name: 'x', span },
    right: intLit(2),
    span,
  },
  span,
};
console.log('evaluate(QUERY(x <* [1,2,3] | x > 2)):', evaluate(queryExpr, ctx));

console.log(SEP);
