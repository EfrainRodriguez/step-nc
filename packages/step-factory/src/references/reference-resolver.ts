import type { FactoryDiagnostic } from '../diagnostics';
import { errorDiag } from '../diagnostics';
import type { StepModel } from '../model/step-model';
import type { EntityInstance } from '../types/instance';
import type { AttributeValue, InstanceId, InstanceRef } from '../types/values';
import {
  isInstanceRef,
  isSelectValue,
  isStepAggregation,
} from '../types/values';

export function createRef(id: InstanceId, entityName: string): InstanceRef {
  return {
    kind: 'ref',
    id,
    entityName: entityName.toUpperCase(),
  };
}

export function resolveRef(
  model: StepModel,
  ref: InstanceRef,
): EntityInstance | undefined {
  return model.getInstance(ref.id);
}

export function validateReferences(model: StepModel): FactoryDiagnostic[] {
  const diagnostics: FactoryDiagnostic[] = [];

  for (const instance of model.getAllInstances()) {
    for (const [attrName, value] of instance.attributes) {
      if (value === undefined) continue;
      collectDanglingRefs(value, model, instance, attrName, diagnostics);
    }
  }

  return diagnostics;
}

export function findReferencesTo(
  model: StepModel,
  targetId: InstanceId,
): Array<{ instance: EntityInstance; attributeName: string }> {
  const results: Array<{ instance: EntityInstance; attributeName: string }> =
    [];

  for (const instance of model.getAllInstances()) {
    for (const [attrName, value] of instance.attributes) {
      if (value === undefined) continue;
      if (containsRefTo(value, targetId)) {
        results.push({ instance, attributeName: attrName });
      }
    }
  }

  return results;
}

// ── Private helpers ─────────────────────────────────────────────────

function collectDanglingRefs(
  value: AttributeValue,
  model: StepModel,
  instance: EntityInstance,
  attrName: string,
  diagnostics: FactoryDiagnostic[],
): void {
  if (isInstanceRef(value)) {
    if (!model.getInstance(value.id)) {
      diagnostics.push(
        errorDiag(
          'DANGLING_REFERENCE',
          `Attribute '${attrName}' references instance #${value.id} which does not exist`,
          {
            instanceId: instance.id,
            entityName: instance.typeName,
            attributeName: attrName,
          },
        ),
      );
    }
    return;
  }

  if (isSelectValue(value)) {
    collectDanglingRefs(value.value, model, instance, attrName, diagnostics);
    return;
  }

  if (isStepAggregation(value)) {
    for (const element of value.elements) {
      if (element === null) continue;
      collectDanglingRefs(
        element as AttributeValue,
        model,
        instance,
        attrName,
        diagnostics,
      );
    }
  }
}

function containsRefTo(value: AttributeValue, targetId: InstanceId): boolean {
  if (isInstanceRef(value)) {
    return value.id === targetId;
  }

  if (isSelectValue(value)) {
    return containsRefTo(value.value, targetId);
  }

  if (isStepAggregation(value)) {
    return value.elements.some(
      (el) => el !== null && containsRefTo(el as AttributeValue, targetId),
    );
  }

  return false;
}
