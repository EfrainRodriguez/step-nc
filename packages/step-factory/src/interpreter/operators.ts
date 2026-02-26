import type { BinaryOperator, UnaryOperator } from '@step-nc/express-parser';
import type { EntityInstance } from '../types/instance';
import type { InstanceRef } from '../types/values';
import { isInstanceRef } from '../types/values';
import { expressLikeToRegex } from './like-pattern';
import { EVAL_INDETERMINATE, type EvalValue } from './types';

export function applyBinaryOperator(
  op: BinaryOperator,
  left: EvalValue,
  right: EvalValue,
): EvalValue {
  if (op === 'AND') return applyLogicalAnd(left, right);
  if (op === 'OR') return applyLogicalOr(left, right);
  if (op === 'XOR') return applyLogicalXor(left, right);

  if (left === EVAL_INDETERMINATE || right === EVAL_INDETERMINATE) {
    return EVAL_INDETERMINATE;
  }

  switch (op) {
    case '+':
      if (typeof left === 'number' && typeof right === 'number')
        return left + right;
      return EVAL_INDETERMINATE;
    case '-':
      if (typeof left === 'number' && typeof right === 'number')
        return left - right;
      return EVAL_INDETERMINATE;
    case '*':
      if (typeof left === 'number' && typeof right === 'number')
        return left * right;
      return EVAL_INDETERMINATE;
    case '/':
      if (typeof left === 'number' && typeof right === 'number') {
        if (right === 0) return EVAL_INDETERMINATE;
        return left / right;
      }
      return EVAL_INDETERMINATE;
    case 'DIV':
      if (typeof left === 'number' && typeof right === 'number') {
        if (right === 0) return EVAL_INDETERMINATE;
        return Math.trunc(left / right);
      }
      return EVAL_INDETERMINATE;
    case 'MOD':
      if (typeof left === 'number' && typeof right === 'number') {
        if (right === 0) return EVAL_INDETERMINATE;
        return left - right * Math.trunc(left / right);
      }
      return EVAL_INDETERMINATE;
    case '**':
      if (typeof left === 'number' && typeof right === 'number')
        return Math.pow(left, right);
      return EVAL_INDETERMINATE;
    case '=':
      return compareEqual(left, right);
    case '<>':
      return negateLogical(compareEqual(left, right));
    case '<':
      return compareLessThan(left, right);
    case '>':
      return compareLessThan(right, left);
    case '<=': {
      const lt = compareLessThan(left, right);
      const eq = compareEqual(left, right);
      if (lt === true || eq === true) return true;
      if (lt === EVAL_INDETERMINATE || eq === EVAL_INDETERMINATE)
        return EVAL_INDETERMINATE;
      return false;
    }
    case '>=': {
      const gt = compareLessThan(right, left);
      const eq = compareEqual(left, right);
      if (gt === true || eq === true) return true;
      if (gt === EVAL_INDETERMINATE || eq === EVAL_INDETERMINATE)
        return EVAL_INDETERMINATE;
      return false;
    }
    case ':=:':
      return instanceEqual(left, right);
    case ':<>:':
      return negateLogical(instanceEqual(left, right));
    case 'IN':
      return applyIn(left, right);
    case '||':
      if (typeof left === 'string' && typeof right === 'string')
        return left + right;
      return EVAL_INDETERMINATE;
    case 'LIKE': {
      if (typeof left !== 'string' || typeof right !== 'string')
        return EVAL_INDETERMINATE;
      return expressLikeToRegex(right).test(left);
    }
    case 'ANDOR':
      return applyLogicalOr(left, right);
  }
}

export function applyUnaryOperator(
  op: UnaryOperator,
  operand: EvalValue,
): EvalValue {
  if (operand === EVAL_INDETERMINATE) return EVAL_INDETERMINATE;

  switch (op) {
    case '+':
      if (typeof operand === 'number') return operand;
      return EVAL_INDETERMINATE;
    case '-':
      if (typeof operand === 'number') return -operand;
      return EVAL_INDETERMINATE;
    case 'NOT':
      if (typeof operand === 'boolean') return !operand;
      if (operand === null) return null;
      return EVAL_INDETERMINATE;
  }
}

function compareEqual(left: EvalValue, right: EvalValue): EvalValue {
  if (typeof left === 'number' && typeof right === 'number')
    return left === right;
  if (typeof left === 'string' && typeof right === 'string')
    return left === right;
  if (typeof left === 'boolean' && typeof right === 'boolean')
    return left === right;
  if (left === null && right === null) return null;
  return EVAL_INDETERMINATE;
}

function compareLessThan(left: EvalValue, right: EvalValue): EvalValue {
  if (typeof left === 'number' && typeof right === 'number')
    return left < right;
  if (typeof left === 'string' && typeof right === 'string')
    return left < right;
  return EVAL_INDETERMINATE;
}

function negateLogical(val: EvalValue): EvalValue {
  if (val === true) return false;
  if (val === false) return true;
  return val;
}

function instanceEqual(left: EvalValue, right: EvalValue): EvalValue {
  const leftRef = extractRef(left);
  const rightRef = extractRef(right);

  if (!leftRef || !rightRef) return EVAL_INDETERMINATE;
  return leftRef.id === rightRef.id;
}

function extractRef(val: EvalValue): InstanceRef | EntityInstance | undefined {
  if (isInstanceRef(val as never)) return val as unknown as InstanceRef;
  if (
    typeof val === 'object' &&
    val !== null &&
    !Array.isArray(val) &&
    'id' in val &&
    'definition' in val
  ) {
    return val as unknown as EntityInstance;
  }
  return undefined;
}

function applyIn(left: EvalValue, right: EvalValue): EvalValue {
  if (!Array.isArray(right)) return EVAL_INDETERMINATE;
  for (const el of right) {
    const eq = compareEqual(left, el);
    if (eq === true) return true;
  }
  return false;
}

function applyLogicalAnd(left: EvalValue, right: EvalValue): EvalValue {
  const l = toBool(left);
  const r = toBool(right);
  if (l === false || r === false) return false;
  if (l === true && r === true) return true;
  return EVAL_INDETERMINATE;
}

function applyLogicalOr(left: EvalValue, right: EvalValue): EvalValue {
  const l = toBool(left);
  const r = toBool(right);
  if (l === true || r === true) return true;
  if (l === false && r === false) return false;
  return EVAL_INDETERMINATE;
}

function applyLogicalXor(left: EvalValue, right: EvalValue): EvalValue {
  const l = toBool(left);
  const r = toBool(right);
  if (l === EVAL_INDETERMINATE || r === EVAL_INDETERMINATE)
    return EVAL_INDETERMINATE;
  if (l === null || r === null) return EVAL_INDETERMINATE;
  return l !== r;
}

function toBool(val: EvalValue): boolean | typeof EVAL_INDETERMINATE | null {
  if (typeof val === 'boolean') return val;
  if (val === null) return null;
  if (val === EVAL_INDETERMINATE) return EVAL_INDETERMINATE;
  return EVAL_INDETERMINATE;
}
