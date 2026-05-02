import type { FactoryDiagnostic } from '../diagnostics';
import { errorDiag } from '../diagnostics';
import type { StepModel } from '../model/step-model';
import type { EntityInstance } from '../types/instance';
import type { AttributeValue, InstanceRef } from '../types/values';
import { isInstanceRef, isStepAggregation } from '../types/values';

export function validateUniqueRules(model: StepModel): FactoryDiagnostic[] {
  const diagnostics: FactoryDiagnostic[] = [];
  const schema = model.schema;

  for (const [entityName, entityDef] of schema.entities) {
    if (entityDef.uniqueRules.length === 0) continue;

    const instances = model.getInstancesOf(entityName, true);
    if (instances.length < 2) continue;

    for (const rule of entityDef.uniqueRules) {
      const attrNames =
        rule.resolvedAttributes?.map((a) => a.name.toUpperCase()) ??
        rule.attributeNames.map((n) => n.toUpperCase());

      const keyMap = new Map<string, EntityInstance>();

      for (const instance of instances) {
        const key = buildUniqueKey(instance, attrNames);
        if (key === null) continue;

        const existing = keyMap.get(key);
        if (existing) {
          const ruleLabel = rule.label ?? '(unnamed)';
          diagnostics.push(
            errorDiag(
              'UNIQUE_VIOLATION',
              `UNIQUE rule '${ruleLabel}' violated: instance #${instance.id} has the same key as instance #${existing.id} for entity '${entityName}'`,
              {
                instanceId: instance.id,
                entityName: instance.typeName,
              },
            ),
          );
        } else {
          keyMap.set(key, instance);
        }
      }
    }
  }

  return diagnostics;
}

function buildUniqueKey(
  instance: EntityInstance,
  attrNames: string[],
): string | null {
  const parts: string[] = [];

  for (const name of attrNames) {
    const value = instance.attributes.get(name);
    if (value === undefined) return null;

    const serialized = serializeValue(value);
    if (serialized === null) return null;
    parts.push(serialized);
  }

  return parts.join('|');
}

function serializeValue(value: AttributeValue | undefined): string | null {
  if (value === undefined) return null;
  if (value === null) return 'null';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'symbol') return null;
  if (value instanceof Uint8Array) return `bin:${Array.from(value).join(',')}`;

  if (isInstanceRef(value)) {
    return `#${(value as InstanceRef).id}`;
  }

  if (isStepAggregation(value)) {
    const elements = value.elements.map((el) =>
      el === null ? 'null' : serializeValue(el as AttributeValue),
    );
    if (elements.some((e) => e === null)) return null;
    return `[${elements.join(',')}]`;
  }

  if (typeof value === 'object' && 'kind' in value && value.kind === 'select') {
    const sv = value as { typePath: readonly string[]; value: AttributeValue };
    const inner = serializeValue(sv.value);
    if (inner === null) return null;
    return `select:${sv.typePath.join('.')}:${inner}`;
  }

  return JSON.stringify(value);
}
