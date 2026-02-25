import type {
  RepeatStatementNode,
  StatementNode,
} from '@step-nc/express-parser';
import { evaluate } from './evaluate';
import {
  EVAL_INDETERMINATE,
  EXEC_ESCAPE,
  EXEC_RETURN,
  EXEC_SKIP,
  type EvalContext,
  type EvalValue,
  type ExecResult,
} from './types';

/** Maximum iterations allowed in a REPEAT loop to prevent infinite loops. */
const MAX_REPEAT_ITERATIONS = 100_000;

/**
 * Executes a list of statements in the given context.
 * Returns undefined on normal completion, or an ExecSignal for RETURN/ESCAPE/SKIP.
 * NOTE: Recursive function calls are not depth-limited in v0.2.1.
 */
export function executeStatements(
  statements: readonly StatementNode[],
  ctx: EvalContext,
): ExecResult {
  for (const stmt of statements) {
    const signal = executeStatement(stmt, ctx);
    if (signal !== undefined) return signal;
  }
  return undefined;
}

function executeStatement(stmt: StatementNode, ctx: EvalContext): ExecResult {
  switch (stmt.type) {
    case 'NullStatement':
      return undefined;

    case 'ReturnStatement': {
      const value =
        stmt.value !== undefined
          ? evaluate(stmt.value, ctx)
          : EVAL_INDETERMINATE;
      return { kind: EXEC_RETURN, value };
    }

    case 'AssignmentStatement': {
      const rhs = evaluate(stmt.value, ctx);
      const target = stmt.target;

      if (target.type === 'IdentifierRef') {
        ensureVariables(ctx);
        ctx.variables!.set(target.name.toUpperCase(), rhs);
      } else {
        // QualifiedRef assignment (e.g. aggregate element) — not supported in v0.2.1
        throw new Error(
          `AssignmentStatement: assignment to '${target.type}' targets is not supported in v0.2.1`,
        );
      }
      return undefined;
    }

    case 'IfStatement': {
      const cond = evaluate(stmt.condition, ctx);
      if (cond === true) {
        return executeStatements(stmt.thenBranch, ctx);
      } else if (stmt.elseBranch) {
        return executeStatements(stmt.elseBranch, ctx);
      }
      return undefined;
    }

    case 'CaseStatement': {
      const selector = evaluate(stmt.selector, ctx);
      for (const action of stmt.actions) {
        for (const sel of action.selectors) {
          const selVal = evaluate(sel, ctx);
          if (selector === selVal) {
            return executeStatements(action.statements, ctx);
          }
        }
      }
      if (stmt.otherwise) {
        return executeStatements(stmt.otherwise, ctx);
      }
      return undefined;
    }

    case 'RepeatStatement':
      return executeRepeat(stmt, ctx);

    case 'AliasStatement': {
      const aliasVal = evaluate(stmt.base, ctx);
      const aliasCtx: EvalContext = {
        ...ctx,
        variables: new Map(ctx.variables ?? []),
      };
      aliasCtx.variables!.set(stmt.variable.toUpperCase(), aliasVal);
      const result = executeStatements(stmt.statements, aliasCtx);
      // Alias scope is local — changes to aliasCtx.variables don't propagate
      return result;
    }

    case 'CompoundStatement':
      return executeStatements(stmt.statements, ctx);

    case 'EscapeStatement':
      return { kind: EXEC_ESCAPE };

    case 'SkipStatement':
      return { kind: EXEC_SKIP };

    case 'ProcedureCallStatement':
      throw new Error(
        `ProcedureCallStatement: procedure '${stmt.procedure}' cannot be evaluated — procedure interpreter not implemented in v0.2.1`,
      );

    default:
      // CaseAction and RepeatControl are handled internally and should not appear at top level
      throw new Error(
        `executeStatement: unhandled statement type '${(stmt as { type: string }).type}'`,
      );
  }
}

function executeRepeat(
  stmt: RepeatStatementNode,
  ctx: EvalContext,
): ExecResult {
  const control = stmt.control;

  if (!control) {
    // Infinite REPEAT — relies entirely on ESCAPE inside the body
    let iterations = 0;
    while (true) {
      if (++iterations > MAX_REPEAT_ITERATIONS) {
        throw new Error(
          `REPEAT exceeded maximum iteration limit (${MAX_REPEAT_ITERATIONS})`,
        );
      }
      const signal = executeStatements(stmt.statements, ctx);
      if (signal === undefined || signal.kind === EXEC_SKIP) continue;
      if (signal.kind === EXEC_ESCAPE) break;
      return signal; // RETURN propagates up
    }
    return undefined;
  }

  if (control.kind === 'WHILE') {
    let iterations = 0;
    while (true) {
      if (++iterations > MAX_REPEAT_ITERATIONS) {
        throw new Error(
          `REPEAT WHILE exceeded maximum iteration limit (${MAX_REPEAT_ITERATIONS})`,
        );
      }
      const cond = evaluate(control.condition!, ctx);
      if (cond !== true) break;
      const signal = executeStatements(stmt.statements, ctx);
      if (signal === undefined || signal.kind === EXEC_SKIP) continue;
      if (signal.kind === EXEC_ESCAPE) break;
      return signal;
    }
    return undefined;
  }

  if (control.kind === 'UNTIL') {
    let iterations = 0;
    while (true) {
      if (++iterations > MAX_REPEAT_ITERATIONS) {
        throw new Error(
          `REPEAT UNTIL exceeded maximum iteration limit (${MAX_REPEAT_ITERATIONS})`,
        );
      }
      const signal = executeStatements(stmt.statements, ctx);
      if (signal !== undefined && signal.kind !== EXEC_SKIP) {
        if (signal.kind === EXEC_ESCAPE) break;
        return signal;
      }
      const cond = evaluate(control.condition!, ctx);
      if (cond === true) break;
    }
    return undefined;
  }

  if (control.kind === 'FOR') {
    const varName = control.variable!.toUpperCase();
    const initial = evaluate(control.initial!, ctx);
    const final = evaluate(control.final!, ctx);
    const increment =
      control.increment !== undefined ? evaluate(control.increment, ctx) : 1;

    if (
      typeof initial !== 'number' ||
      typeof final !== 'number' ||
      typeof increment !== 'number'
    ) {
      return undefined; // INDETERMINATE bounds — skip loop
    }

    ensureVariables(ctx);
    let iterations = 0;
    for (
      let i = initial;
      increment > 0 ? i <= final : i >= final;
      i += increment
    ) {
      if (++iterations > MAX_REPEAT_ITERATIONS) {
        throw new Error(
          `REPEAT FOR exceeded maximum iteration limit (${MAX_REPEAT_ITERATIONS})`,
        );
      }
      ctx.variables!.set(varName, i);
      const signal = executeStatements(stmt.statements, ctx);
      if (signal === undefined || signal.kind === EXEC_SKIP) continue;
      if (signal.kind === EXEC_ESCAPE) break;
      return signal;
    }
    return undefined;
  }

  throw new Error(`executeRepeat: unknown control kind '${control.kind}'`);
}

/** Ensures ctx.variables is initialized (mutates ctx in place for local-frame use). */
function ensureVariables(ctx: EvalContext): void {
  if (!ctx.variables) {
    (ctx as { variables: Map<string, EvalValue> }).variables = new Map();
  }
}
