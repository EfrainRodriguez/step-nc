import type {
  EntityDefinition,
  WhereRuleDefinition,
} from '@step-nc/express-dictionary';
import type { FactoryDiagnostic } from '../diagnostics';
import { errorDiag, warningDiag } from '../diagnostics';
import { evaluate } from '../interpreter/evaluate';
import {
  EVAL_INDETERMINATE,
  EvalError,
  type EvalContext,
} from '../interpreter/types';
import type { StepModel } from '../model/step-model';
import type { EntityInstance } from '../types/instance';

export function validateWhereRules(
  instance: EntityInstance,
  model: StepModel,
): FactoryDiagnostic[] {
  const diagnostics: FactoryDiagnostic[] = [];
  const allRules = getAllWhereRules(instance.definition);

  for (const rule of allRules) {
    const ctx: EvalContext = {
      self: instance,
      model,
      schema: model.schema,
    };

    try {
      const result = evaluate(rule.expression, ctx);

      if (result === false) {
        const ruleLabel = rule.label ?? '(unnamed)';
        diagnostics.push(
          errorDiag(
            'WHERE_RULE_VIOLATION',
            `WHERE rule '${ruleLabel}' failed on entity '${instance.typeName}'`,
            {
              instanceId: instance.id,
              entityName: instance.typeName,
            },
          ),
        );
      } else if (result === EVAL_INDETERMINATE) {
        const ruleLabel = rule.label ?? '(unnamed)';
        diagnostics.push(
          warningDiag(
            'WHERE_RULE_VIOLATION',
            `WHERE rule '${ruleLabel}' evaluated to UNKNOWN on entity '${instance.typeName}'`,
            {
              instanceId: instance.id,
              entityName: instance.typeName,
            },
          ),
        );
      }
    } catch (err) {
      const ruleLabel = rule.label ?? '(unnamed)';
      const message = err instanceof EvalError ? err.message : String(err);

      diagnostics.push(
        warningDiag(
          'EXPRESSION_EVAL_ERROR',
          `Failed to evaluate WHERE rule '${ruleLabel}' on entity '${instance.typeName}': ${message}`,
          {
            instanceId: instance.id,
            entityName: instance.typeName,
          },
        ),
      );
    }
  }

  return diagnostics;
}

function getAllWhereRules(entity: EntityDefinition): WhereRuleDefinition[] {
  const result: WhereRuleDefinition[] = [];
  const seen = new Set<string>();

  collectWhereRules(entity, result, seen);

  return result;
}

function collectWhereRules(
  entity: EntityDefinition,
  result: WhereRuleDefinition[],
  seen: Set<string>,
): void {
  for (const supertype of entity.supertypes) {
    collectWhereRules(supertype, result, seen);
  }

  for (const rule of entity.whereRules) {
    const key = `${entity.name.toUpperCase()}.${rule.label ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(rule);
    }
  }
}
