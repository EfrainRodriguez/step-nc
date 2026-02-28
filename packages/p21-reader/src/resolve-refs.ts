import type {
  AttributeValue,
  InstanceId,
  StepModel,
} from '@step-nc/step-factory';
import {
  createRef,
  isInstanceRef,
  isSelectValue,
  isStepAggregation,
} from '@step-nc/step-factory';
import type { ReaderDiagnostic } from './diagnostics';
import { errorDiag, warningDiag } from './diagnostics';

export interface RefContext {
  instanceId?: InstanceId;
  entityName?: string;
  attributeName?: string;
}

/**
 * Walk an AttributeValue tree and replace placeholder InstanceRef
 * (entityName === '') with resolved refs from the model.
 */
export function resolveRefsInValue(
  value: AttributeValue,
  model: StepModel,
  strictRefs: boolean,
  context: RefContext,
  diagnostics: ReaderDiagnostic[],
): AttributeValue {
  if (isInstanceRef(value)) {
    if (value.entityName === '') {
      const target = model.getInstance(value.id);
      if (target) {
        return createRef(value.id, target.typeName);
      }
      diagnostics.push(
        strictRefs
          ? errorDiag(
              'DANGLING_ENTITY_REF',
              `Reference #${value.id} not found in model`,
              context,
            )
          : warningDiag(
              'DANGLING_ENTITY_REF',
              `Reference #${value.id} not found in model`,
              context,
            ),
      );
      return value;
    }
    return value;
  }

  if (isSelectValue(value)) {
    const resolvedInner = resolveRefsInValue(
      value.value,
      model,
      strictRefs,
      context,
      diagnostics,
    );
    if (resolvedInner !== value.value) {
      return { ...value, value: resolvedInner };
    }
    return value;
  }

  if (isStepAggregation(value)) {
    let changed = false;
    const newElements = value.elements.map((el) => {
      if (el === null) return el;
      const resolved = resolveRefsInValue(
        el as AttributeValue,
        model,
        strictRefs,
        context,
        diagnostics,
      );
      if (resolved !== el) changed = true;
      return resolved;
    });
    if (changed) {
      return { ...value, elements: newElements } as AttributeValue;
    }
    return value;
  }

  return value;
}
