import {
  getAllAttributes,
  getAllDerivedAttributes,
} from '@step-nc/express-dictionary';
import type { ExpressionNode } from '@step-nc/express-parser';
import { resolveRef } from '../references/reference-resolver';
import type { EntityInstance } from '../types/instance';
import type { AttributeValue, InstanceId, InstanceRef } from '../types/values';
import { isInstanceRef } from '../types/values';
import { builtins } from './builtins';
import { executeStatements } from './execute-statements';
import { applyBinaryOperator, applyUnaryOperator } from './operators';
import {
  EVAL_INDETERMINATE,
  EXEC_RETURN,
  EvalError,
  type EvalContext,
  type EvalValue,
} from './types';

export function evaluate(expr: ExpressionNode, ctx: EvalContext): EvalValue {
  switch (expr.type) {
    case 'IntegerLiteral':
      return expr.value;

    case 'RealLiteral':
      return expr.value;

    case 'StringLiteral':
      return expr.value;

    case 'BinaryLiteral':
      return expr.value;

    case 'LogicalLiteral':
      if (expr.value === 'TRUE') return true;
      if (expr.value === 'FALSE') return false;
      return EVAL_INDETERMINATE;

    case 'IndeterminateLiteral':
      return EVAL_INDETERMINATE;

    case 'EnumRef':
      return expr.enumValue;

    case 'BinaryExpression': {
      const left = evaluate(expr.left, ctx);
      const right = evaluate(expr.right, ctx);
      return applyBinaryOperator(expr.operator, left, right);
    }

    case 'UnaryExpression': {
      const operand = evaluate(expr.operand, ctx);
      return applyUnaryOperator(expr.operator, operand);
    }

    case 'SelfRef':
      return evaluateSelfRef(ctx, expr);

    case 'IdentifierRef':
      return evaluateIdentifierRef(expr.name, ctx, expr);

    case 'QualifiedRef':
      return evaluateQualifiedRef(expr, ctx);

    case 'FunctionCallExpression':
      return evaluateFunctionCall(expr, ctx);

    case 'QueryExpression':
      return evaluateQuery(expr, ctx);

    case 'AggregateInitializer':
      return evaluateAggregateInitializer(expr, ctx);

    case 'IntervalExpression':
      return evaluateInterval(expr, ctx);

    case 'EntityConstructor':
      return evaluateEntityConstructor(expr, ctx);

    default:
      throw new EvalError(
        `Unsupported expression type: ${(expr as { type: string }).type}`,
        expr,
      );
  }
}

function evaluateSelfRef(ctx: EvalContext, node: ExpressionNode): EvalValue {
  if (!ctx.self) {
    throw new EvalError(
      'SELF reference used outside of instance context',
      node,
    );
  }
  return ctx.self as unknown as EvalValue;
}

function evaluateIdentifierRef(
  name: string,
  ctx: EvalContext,
  node: ExpressionNode,
): EvalValue {
  const upperName = name.toUpperCase();

  if (ctx.variables) {
    const varVal = ctx.variables.get(upperName);
    if (varVal !== undefined) return varVal;
  }

  if (ctx.self) {
    const attrVal = ctx.self.attributes.get(upperName);
    if (attrVal !== undefined) return attrVal as unknown as EvalValue;
  }

  if (ctx.schema.entities.has(upperName)) {
    return upperName;
  }

  for (const typeDef of ctx.schema.types.values()) {
    const desc = typeDef.underlyingType;
    if (desc.kind === 'enumeration') {
      const found = desc.values.find((v) => v.toUpperCase() === upperName);
      if (found) return found;
    }
  }

  const constant = ctx.schema.constants.get(upperName);
  if (constant) {
    return evaluate(constant.expression, ctx);
  }

  throw new EvalError(`Unresolved identifier: '${name}'`, node);
}

function evaluateQualifiedRef(
  expr: ExpressionNode & { type: 'QualifiedRef' },
  ctx: EvalContext,
): EvalValue {
  let current = evaluate(expr.root, ctx);

  for (const qualifier of expr.qualifiers) {
    if (
      current === EVAL_INDETERMINATE ||
      current === null ||
      current === undefined
    ) {
      return EVAL_INDETERMINATE;
    }

    switch (qualifier.type) {
      case 'AttributeRef': {
        const attrName = qualifier.name.toUpperCase();
        // Resolve InstanceRef to EntityInstance when model is available
        if (ctx.model && isInstanceRef(current as AttributeValue)) {
          const resolved = resolveRef(ctx.model, current as InstanceRef);
          if (resolved) current = resolved as unknown as EvalValue;
        }
        const instance = toEntityInstance(current);
        if (instance) {
          const val = instance.attributes.get(attrName);
          if (val !== undefined) {
            current = val as unknown as EvalValue;
          } else {
            const derived = tryGetDerivedValue(instance, attrName, ctx);
            current = derived;
          }
        } else {
          return EVAL_INDETERMINATE;
        }
        break;
      }

      case 'GroupRef': {
        // Group qualifier (\EntityName) — navigates to supertype view.
        // The instance itself already carries all inherited attributes,
        // so we just verify the entity name is a valid supertype and pass through.
        current = current;
        break;
      }

      case 'IndexRef': {
        const index = evaluate(qualifier.index, ctx);
        if (typeof index !== 'number') return EVAL_INDETERMINATE;

        if (qualifier.upperIndex) {
          const upper = evaluate(qualifier.upperIndex, ctx);
          if (typeof upper !== 'number') return EVAL_INDETERMINATE;
          if (Array.isArray(current)) {
            const startIdx = Math.max(0, index - 1);
            const endIdx = upper;
            current = current.slice(startIdx, endIdx);
          } else {
            return EVAL_INDETERMINATE;
          }
        } else {
          if (Array.isArray(current)) {
            current = current[index - 1] ?? EVAL_INDETERMINATE;
          } else if (
            typeof current === 'object' &&
            current !== null &&
            'kind' in current &&
            'elements' in current
          ) {
            const agg = current as {
              kind: string;
              elements: readonly unknown[];
              lowerIndex?: number;
            };
            const lowerIdx = agg.lowerIndex ?? 1;
            const adjustedIdx = index - lowerIdx;
            const el = agg.elements[adjustedIdx];
            current = (el ?? EVAL_INDETERMINATE) as EvalValue;
          } else if (typeof current === 'string') {
            current = current[index - 1] ?? EVAL_INDETERMINATE;
          } else {
            return EVAL_INDETERMINATE;
          }
        }
        break;
      }
    }
  }

  return current;
}

function evaluateFunctionCall(
  expr: ExpressionNode & { type: 'FunctionCallExpression' },
  ctx: EvalContext,
): EvalValue {
  const args = expr.args.map((a) => evaluate(a, ctx));
  const fnName = expr.name.toUpperCase();

  const builtinFn = getBuiltinFunction(fnName);
  if (builtinFn) {
    return builtinFn(args, ctx);
  }

  if (ctx.schema.functions.has(fnName)) {
    const funcDef = ctx.schema.functions.get(fnName)!;

    if (!funcDef.body || funcDef.body.length === 0) {
      // No body available (e.g. imported function without AST)
      return EVAL_INDETERMINATE;
    }

    // Build local variable frame: bind parameters
    const localVars = new Map<string, EvalValue>();
    funcDef.parameters.forEach((param, index) => {
      localVars.set(
        param.name.toUpperCase(),
        args[index] ?? EVAL_INDETERMINATE,
      );
    });

    // Initialize local variables declared in the function header
    if (funcDef.localDeclarations) {
      for (const decl of funcDef.localDeclarations) {
        if (decl.type === 'LocalVariable') {
          // Each LocalVariableNode declares exactly one variable
          const initVal = decl.initialValue
            ? evaluate(decl.initialValue, { ...ctx, variables: localVars })
            : EVAL_INDETERMINATE;
          localVars.set(decl.name.toUpperCase(), initVal);
        }
      }
    }

    const funcCtx: EvalContext = { ...ctx, variables: localVars };
    const signal = executeStatements(funcDef.body, funcCtx);

    if (signal !== undefined && signal.kind === EXEC_RETURN) {
      return signal.value;
    }

    // Function body completed without RETURN — indeterminate result
    return EVAL_INDETERMINATE;
  }

  throw new EvalError(`Unknown function: '${expr.name}'`, expr);
}

function evaluateQuery(
  expr: ExpressionNode & { type: 'QueryExpression' },
  ctx: EvalContext,
): EvalValue {
  const source = evaluate(expr.source, ctx);
  if (!Array.isArray(source) && !isAggregation(source)) {
    throw new EvalError('QUERY source must be an aggregate', expr);
  }

  const elements = Array.isArray(source)
    ? source
    : (source as unknown as { elements: readonly unknown[] }).elements;

  const result: EvalValue[] = [];
  const varName = expr.variable.toUpperCase();
  const variables = new Map(ctx.variables ?? []);

  for (const element of elements) {
    variables.set(varName, element as EvalValue);
    const condCtx: EvalContext = { ...ctx, variables };
    const condResult = evaluate(expr.condition, condCtx);
    if (condResult === true) {
      result.push(element as EvalValue);
    }
  }

  return result;
}

function evaluateAggregateInitializer(
  expr: ExpressionNode & { type: 'AggregateInitializer' },
  ctx: EvalContext,
): EvalValue {
  const result: EvalValue[] = [];

  for (const element of expr.elements) {
    const value = evaluate(element.value, ctx);
    if (element.repetition) {
      const count = evaluate(element.repetition, ctx);
      if (typeof count === 'number' && count > 0) {
        for (let i = 0; i < count; i++) {
          result.push(value);
        }
      }
    } else {
      result.push(value);
    }
  }

  return result;
}

function evaluateInterval(
  expr: ExpressionNode & { type: 'IntervalExpression' },
  ctx: EvalContext,
): EvalValue {
  const low = evaluate(expr.low, ctx);
  const value = evaluate(expr.value, ctx);
  const high = evaluate(expr.high, ctx);

  if (
    typeof low !== 'number' ||
    typeof value !== 'number' ||
    typeof high !== 'number'
  ) {
    return EVAL_INDETERMINATE;
  }

  const leftOk = expr.lowOp === '<' ? low < value : low <= value;
  const rightOk = expr.highOp === '<' ? value < high : value <= high;

  return leftOk && rightOk;
}

function toEntityInstance(val: EvalValue): EntityInstance | undefined {
  if (
    typeof val === 'object' &&
    val !== null &&
    !Array.isArray(val) &&
    'id' in val &&
    'definition' in val &&
    'attributes' in val
  ) {
    return val as unknown as EntityInstance;
  }
  return undefined;
}

function tryGetDerivedValue(
  instance: EntityInstance,
  attrName: string,
  ctx: EvalContext,
): EvalValue {
  const derived = getAllDerivedAttributes(instance.definition);
  const attr = derived.find((d) => d.name.toUpperCase() === attrName);

  if (!attr) return EVAL_INDETERMINATE;

  const derivedCtx: EvalContext = {
    ...ctx,
    self: instance,
  };
  return evaluate(attr.expression, derivedCtx);
}

function isAggregation(val: EvalValue): boolean {
  return (
    typeof val === 'object' &&
    val !== null &&
    !Array.isArray(val) &&
    'kind' in val &&
    'elements' in val
  );
}

function evaluateEntityConstructor(
  expr: ExpressionNode & { type: 'EntityConstructor' },
  ctx: EvalContext,
): EvalValue {
  const entityName = expr.entity.toUpperCase();
  const entityDef = ctx.schema.entities.get(entityName);

  if (!entityDef) {
    throw new EvalError(
      `EntityConstructor: unknown entity '${expr.entity}'`,
      expr,
    );
  }

  // getAllAttributes returns only ExplicitAttribute[] (no derived/inverse)
  const explicitAttrs = getAllAttributes(entityDef);
  const args = expr.args.map((a) => evaluate(a, ctx));

  if (args.length !== explicitAttrs.length) {
    throw new EvalError(
      `EntityConstructor '${expr.entity}': expected ${explicitAttrs.length} arguments, got ${args.length}`,
      expr,
    );
  }

  // Build temporary EntityInstance (id=0, not registered in any StepModel)
  const attributes = new Map<string, AttributeValue | undefined>();
  explicitAttrs.forEach((attr, index) => {
    attributes.set(attr.name.toUpperCase(), args[index] as AttributeValue);
  });

  const tempInstance: EntityInstance = {
    id: 0 as InstanceId,
    definition: entityDef,
    typeName: entityDef.name.toUpperCase(),
    attributes,
    attributeDefinitions: new Map(
      explicitAttrs.map((a) => [a.name.toUpperCase(), a]),
    ),
    _derivedCache: new Map(),
  };

  return tempInstance as unknown as EvalValue;
}

function getBuiltinFunction(
  name: string,
): ((args: EvalValue[], ctx: EvalContext) => EvalValue) | undefined {
  return builtins.get(name);
}
