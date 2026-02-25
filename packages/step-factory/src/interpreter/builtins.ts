import { getSupertypeChain } from '@step-nc/express-dictionary';
import { findReferencesTo } from '../references/reference-resolver';
import type { EntityInstance } from '../types/instance';
import type { InstanceId, StepAggregation } from '../types/values';
import { isInstanceRef, isStepAggregation } from '../types/values';
import { EVAL_INDETERMINATE, type EvalContext, type EvalValue } from './types';

type BuiltinFn = (args: EvalValue[], ctx: EvalContext) => EvalValue;

function getAggregateElements(val: EvalValue): EvalValue[] | undefined {
  if (Array.isArray(val)) return val;
  if (isStepAggregation(val as import('../types/values').AttributeValue)) {
    return [...(val as unknown as StepAggregation).elements] as EvalValue[];
  }
  return undefined;
}

function isEntityInstance(val: EvalValue): val is EntityInstance {
  return (
    typeof val === 'object' &&
    val !== null &&
    !Array.isArray(val) &&
    'id' in val &&
    'definition' in val &&
    'attributes' in val
  );
}

const builtinAbs: BuiltinFn = (args) => {
  const x = args[0];
  if (typeof x === 'number') return Math.abs(x);
  return EVAL_INDETERMINATE;
};

const builtinSqrt: BuiltinFn = (args) => {
  const x = args[0];
  if (typeof x === 'number' && x >= 0) return Math.sqrt(x);
  return EVAL_INDETERMINATE;
};

const builtinSin: BuiltinFn = (args) => {
  const x = args[0];
  if (typeof x === 'number') return Math.sin(x);
  return EVAL_INDETERMINATE;
};

const builtinCos: BuiltinFn = (args) => {
  const x = args[0];
  if (typeof x === 'number') return Math.cos(x);
  return EVAL_INDETERMINATE;
};

const builtinTan: BuiltinFn = (args) => {
  const x = args[0];
  if (typeof x === 'number') return Math.tan(x);
  return EVAL_INDETERMINATE;
};

const builtinAsin: BuiltinFn = (args) => {
  const x = args[0];
  if (typeof x === 'number' && x >= -1 && x <= 1) return Math.asin(x);
  return EVAL_INDETERMINATE;
};

const builtinAcos: BuiltinFn = (args) => {
  const x = args[0];
  if (typeof x === 'number' && x >= -1 && x <= 1) return Math.acos(x);
  return EVAL_INDETERMINATE;
};

const builtinAtan: BuiltinFn = (args) => {
  const y = args[0];
  const x = args[1];
  if (typeof y === 'number' && typeof x === 'number') return Math.atan2(y, x);
  if (typeof y === 'number' && args.length === 1) return Math.atan(y);
  return EVAL_INDETERMINATE;
};

const builtinExp: BuiltinFn = (args) => {
  const x = args[0];
  if (typeof x === 'number') return Math.exp(x);
  return EVAL_INDETERMINATE;
};

const builtinLog: BuiltinFn = (args) => {
  const x = args[0];
  if (typeof x === 'number' && x > 0) return Math.log(x);
  return EVAL_INDETERMINATE;
};

const builtinLog2: BuiltinFn = (args) => {
  const x = args[0];
  if (typeof x === 'number' && x > 0) return Math.log2(x);
  return EVAL_INDETERMINATE;
};

const builtinLog10: BuiltinFn = (args) => {
  const x = args[0];
  if (typeof x === 'number' && x > 0) return Math.log10(x);
  return EVAL_INDETERMINATE;
};

const builtinExists: BuiltinFn = (args) => {
  const v = args[0];
  if (v === EVAL_INDETERMINATE || v === undefined || v === null) return false;
  return true;
};

const builtinNvl: BuiltinFn = (args) => {
  const v = args[0];
  const defaultVal = args[1];
  if (v === EVAL_INDETERMINATE || v === undefined || v === null)
    return defaultVal ?? EVAL_INDETERMINATE;
  return v;
};

const builtinSizeof: BuiltinFn = (args) => {
  const agg = args[0];
  if (agg === undefined) return EVAL_INDETERMINATE;
  const elements = getAggregateElements(agg);
  if (elements) return elements.length;
  if (typeof agg === 'string') return agg.length;
  return EVAL_INDETERMINATE;
};

const builtinHiindex: BuiltinFn = (args) => {
  const agg = args[0];
  if (Array.isArray(agg)) return agg.length;
  if (isStepAggregation(agg as import('../types/values').AttributeValue)) {
    const a = agg as unknown as StepAggregation;
    if (a.kind === 'array') {
      return (a as { lowerIndex: number }).lowerIndex + a.elements.length - 1;
    }
    return a.elements.length;
  }
  return EVAL_INDETERMINATE;
};

const builtinLoindex: BuiltinFn = (args) => {
  const agg = args[0];
  if (Array.isArray(agg)) return 1;
  if (isStepAggregation(agg as import('../types/values').AttributeValue)) {
    const a = agg as unknown as StepAggregation;
    if (a.kind === 'array') {
      return (a as { lowerIndex: number }).lowerIndex;
    }
    return 1;
  }
  return EVAL_INDETERMINATE;
};

const builtinHibound: BuiltinFn = (args) => {
  const agg = args[0];
  if (agg === undefined) return EVAL_INDETERMINATE;
  const elements = getAggregateElements(agg);
  if (elements) return elements.length;
  return EVAL_INDETERMINATE;
};

const builtinLobound: BuiltinFn = (args) => {
  const agg = args[0];
  if (agg === undefined) return EVAL_INDETERMINATE;
  if (Array.isArray(agg)) return 0;
  if (isStepAggregation(agg as import('../types/values').AttributeValue)) {
    const a = agg as unknown as StepAggregation;
    if (a.kind === 'array') {
      return (a as { lowerIndex: number }).lowerIndex;
    }
    return 0;
  }
  return EVAL_INDETERMINATE;
};

const builtinTypeof: BuiltinFn = (args, ctx) => {
  const v = args[0];
  if (v === undefined) return EVAL_INDETERMINATE;
  const result: string[] = [];

  if (isEntityInstance(v)) {
    const schemaName = ctx.schema.name.toUpperCase();
    const entity = v.definition;
    result.push(`${schemaName}.${entity.name.toUpperCase()}`);

    const chain = getSupertypeChain(entity);
    for (const sup of chain) {
      result.push(`${schemaName}.${sup.name.toUpperCase()}`);
    }
  } else if (isInstanceRef(v as import('../types/values').AttributeValue)) {
    const ref = v as unknown as { entityName: string };
    const schemaName = ctx.schema.name.toUpperCase();
    result.push(`${schemaName}.${ref.entityName.toUpperCase()}`);
  } else if (typeof v === 'number') {
    if (Number.isInteger(v)) {
      result.push('INTEGER', 'REAL', 'NUMBER');
    } else {
      result.push('REAL', 'NUMBER');
    }
  } else if (typeof v === 'string') {
    result.push('STRING');
  } else if (typeof v === 'boolean') {
    result.push('BOOLEAN', 'LOGICAL');
  }

  return result as unknown as EvalValue;
};

const builtinUsedin: BuiltinFn = (args, ctx) => {
  if (!ctx.model) return [];

  const inst = args[0];
  if (inst === undefined || !isEntityInstance(inst)) return [];

  const refs = findReferencesTo(ctx.model, inst.id as InstanceId);
  return refs.map((r) => r.instance) as unknown as EvalValue[];
};

const builtinLength: BuiltinFn = (args) => {
  const s = args[0];
  if (typeof s === 'string') return s.length;
  return EVAL_INDETERMINATE;
};

const builtinValue: BuiltinFn = (args) => {
  const s = args[0];
  if (typeof s === 'string') {
    const n = Number(s);
    if (isNaN(n)) return EVAL_INDETERMINATE;
    return n;
  }
  return EVAL_INDETERMINATE;
};

const builtinOdd: BuiltinFn = (args) => {
  const n = args[0];
  if (typeof n === 'number' && Number.isInteger(n)) return n % 2 !== 0;
  return EVAL_INDETERMINATE;
};

const builtinBlength: BuiltinFn = (args) => {
  const b = args[0];
  if (typeof b === 'string') return b.length * 4;
  return EVAL_INDETERMINATE;
};

export const builtins: Map<string, BuiltinFn> = new Map([
  ['ABS', builtinAbs],
  ['SQRT', builtinSqrt],
  ['SIN', builtinSin],
  ['COS', builtinCos],
  ['TAN', builtinTan],
  ['ASIN', builtinAsin],
  ['ACOS', builtinAcos],
  ['ATAN', builtinAtan],
  ['EXP', builtinExp],
  ['LOG', builtinLog],
  ['LOG2', builtinLog2],
  ['LOG10', builtinLog10],
  ['EXISTS', builtinExists],
  ['NVL', builtinNvl],
  ['SIZEOF', builtinSizeof],
  ['HIINDEX', builtinHiindex],
  ['LOINDEX', builtinLoindex],
  ['HIBOUND', builtinHibound],
  ['LOBOUND', builtinLobound],
  ['TYPEOF', builtinTypeof],
  ['USEDIN', builtinUsedin],
  ['LENGTH', builtinLength],
  ['VALUE', builtinValue],
  ['ODD', builtinOdd],
  ['BLENGTH', builtinBlength],
]);
