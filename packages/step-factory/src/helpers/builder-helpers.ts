import { setAttributes } from '../attributes/attribute-access';
import type { FactoryDiagnostic } from '../diagnostics';
import { errorDiag } from '../diagnostics';
import type { StepModel } from '../model/step-model';
import type { EntityInstance } from '../types/instance';
import type { AttributeValue, InstanceId } from '../types/values';

export interface PopulateResult {
  readonly instance: EntityInstance | undefined;
  readonly diagnostics: FactoryDiagnostic[];
}

export function createAndPopulate(
  model: StepModel,
  entityName: string,
  attributes: Record<string, AttributeValue>,
): PopulateResult {
  const { instance, diagnostics } = model.createInstance(entityName);

  if (!instance) {
    return { instance: undefined, diagnostics };
  }

  const attrDiags = setAttributes(instance, attributes, model.schema);

  return {
    instance,
    diagnostics: [...diagnostics, ...attrDiags],
  };
}

export function cloneInstance(
  model: StepModel,
  sourceId: InstanceId,
): PopulateResult {
  const source = model.getInstance(sourceId);

  if (!source) {
    return {
      instance: undefined,
      diagnostics: [
        errorDiag(
          'DANGLING_REFERENCE',
          `Cannot clone: instance #${sourceId} does not exist`,
          { instanceId: sourceId },
        ),
      ],
    };
  }

  const { instance, diagnostics } = model.createInstance(source.typeName);
  if (!instance) {
    return { instance: undefined, diagnostics };
  }

  for (const [key, value] of source.attributes) {
    if (value !== undefined) {
      (instance.attributes as Map<string, AttributeValue | undefined>).set(
        key,
        value,
      );
    }
  }

  return { instance, diagnostics };
}

export function instanceToRecord(instance: EntityInstance): {
  id: number;
  typeName: string;
  attributes: Record<string, unknown>;
} {
  const attributes: Record<string, unknown> = {};

  for (const [key, value] of instance.attributes) {
    attributes[key] = value === undefined ? null : value;
  }

  return {
    id: instance.id as number,
    typeName: instance.typeName,
    attributes,
  };
}
