import type { ExpressSchema } from '@step-nc/express-dictionary';
import type { ExpressionNode } from '@step-nc/express-parser';
import type { StepModel } from '../model/step-model';
import type { EntityInstance } from '../types/instance';
import type { InstanceRef } from '../types/values';

export const EVAL_INDETERMINATE: unique symbol = Symbol.for(
  'step-factory.EVAL_INDETERMINATE',
);
export type EvalIndeterminate = typeof EVAL_INDETERMINATE;

export type EvalValue =
  | number
  | string
  | boolean
  | null
  | EvalValue[]
  | EntityInstance
  | InstanceRef
  | EvalIndeterminate;

export interface EvalContext {
  self?: EntityInstance;
  model?: StepModel;
  schema: ExpressSchema;
  variables?: Map<string, EvalValue>;
}

export class EvalError extends Error {
  readonly node: ExpressionNode;

  constructor(message: string, node: ExpressionNode) {
    super(message);
    this.name = 'EvalError';
    this.node = node;
  }
}

// ── Control-flow signals for the statement interpreter ────────────────────────

export const EXEC_RETURN: unique symbol = Symbol.for(
  'step-factory.EXEC_RETURN',
);
export const EXEC_ESCAPE: unique symbol = Symbol.for(
  'step-factory.EXEC_ESCAPE',
);
export const EXEC_SKIP: unique symbol = Symbol.for('step-factory.EXEC_SKIP');

export type ExecSignal =
  | { readonly kind: typeof EXEC_RETURN; readonly value: EvalValue }
  | { readonly kind: typeof EXEC_ESCAPE }
  | { readonly kind: typeof EXEC_SKIP };

/** Return type of executeStatement/executeStatements: undefined = normal, ExecSignal = control flow */
export type ExecResult = undefined | ExecSignal;
