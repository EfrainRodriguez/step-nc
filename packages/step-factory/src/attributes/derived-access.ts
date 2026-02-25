import { getAllDerivedAttributes } from '@step-nc/express-dictionary';
import type { FactoryDiagnostic } from '../diagnostics';
import { errorDiag } from '../diagnostics';
import { evaluate } from '../interpreter/evaluate';
import {
  EvalError,
  type EvalContext,
  type EvalValue,
} from '../interpreter/types';
import type { StepModel } from '../model/step-model';
import type { EntityInstance } from '../types/instance';

export interface DerivedAttributeResult {
  readonly value: EvalValue | undefined;
  readonly diagnostics: FactoryDiagnostic[];
}

export function getDerivedAttribute(
  instance: EntityInstance,
  attrName: string,
  model: StepModel,
): DerivedAttributeResult {
  const key = attrName.toUpperCase();

  // Return cached value if present (cache is invalidated on setAttribute)
  if (instance._derivedCache.has(key)) {
    return { value: instance._derivedCache.get(key), diagnostics: [] };
  }

  const allDerived = getAllDerivedAttributes(instance.definition);
  const derivedAttr = allDerived.find((d) => d.name.toUpperCase() === key);

  if (!derivedAttr) {
    return { value: undefined, diagnostics: [] };
  }

  const ctx: EvalContext = {
    self: instance,
    model,
    schema: model.schema,
  };

  try {
    const value = evaluate(derivedAttr.expression, ctx);
    instance._derivedCache.set(key, value);
    return { value, diagnostics: [] };
  } catch (err) {
    const message =
      err instanceof EvalError
        ? err.message
        : `Failed to compute derived attribute '${key}': ${String(err)}`;

    return {
      value: undefined,
      diagnostics: [
        errorDiag('DERIVED_COMPUTATION_ERROR', message, {
          instanceId: instance.id,
          entityName: instance.typeName,
          attributeName: key,
        }),
      ],
    };
  }
}

export function hasDerivedAttribute(
  instance: EntityInstance,
  attrName: string,
): boolean {
  const key = attrName.toUpperCase();
  const allDerived = getAllDerivedAttributes(instance.definition);
  return allDerived.some((d) => d.name.toUpperCase() === key);
}

export function getDerivedAttributeNames(instance: EntityInstance): string[] {
  const allDerived = getAllDerivedAttributes(instance.definition);
  return allDerived.map((d) => d.name.toUpperCase());
}
