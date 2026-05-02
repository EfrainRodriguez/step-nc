import type {
  AggregationTypeDescriptor,
  SelectTypeDescriptor,
} from '@step-nc/express-dictionary';
import { resolveToBaseType } from '@step-nc/express-dictionary';
import { validateAggregationBounds } from '../aggregations/aggregation-factory';
import {
  getExpectedTypeName,
  isValueCompatible,
} from '../attributes/type-mapping';
import type { FactoryDiagnostic } from '../diagnostics';
import { errorDiag } from '../diagnostics';
import type { StepModel } from '../model/step-model';
import { validateSelectValue } from '../select/select-value';
import type { EntityInstance } from '../types/instance';
import {
  isInstanceRef,
  isSelectValue,
  isStepAggregation,
} from '../types/values';
import { validateWhereRules } from './validate-where-rules';

export function validateInstance(
  instance: EntityInstance,
  model: StepModel,
): FactoryDiagnostic[] {
  const diagnostics: FactoryDiagnostic[] = [];
  const schema = model.schema;

  for (const [attrName, value] of instance.attributes) {
    const attrDef = instance.attributeDefinitions.get(attrName);
    if (!attrDef) continue;

    if (value === undefined) {
      if (!attrDef.optional) {
        diagnostics.push(
          errorDiag(
            'REQUIRED_ATTRIBUTE',
            `Required attribute '${attrName}' is not set`,
            {
              instanceId: instance.id,
              entityName: instance.typeName,
              attributeName: attrName,
            },
          ),
        );
      }
      continue;
    }

    if (!isValueCompatible(attrDef.type, value, schema)) {
      diagnostics.push(
        errorDiag(
          'TYPE_MISMATCH',
          `Attribute '${attrName}' expects ${getExpectedTypeName(attrDef.type)}, got incompatible value`,
          {
            instanceId: instance.id,
            entityName: instance.typeName,
            attributeName: attrName,
          },
        ),
      );
      continue;
    }

    if (isStepAggregation(value)) {
      const resolved = resolveToBaseType(attrDef.type);
      if (resolved.kind === 'aggregation') {
        const boundDiag = validateAggregationBounds(
          value,
          resolved as AggregationTypeDescriptor,
        );
        if (boundDiag) {
          diagnostics.push({
            ...boundDiag,
            instanceId: instance.id,
            entityName: instance.typeName,
            attributeName: attrName,
          });
        }
      }
    }

    if (isSelectValue(value)) {
      const resolved = resolveToBaseType(attrDef.type);
      if (resolved.kind === 'select') {
        const selectDiags = validateSelectValue(
          value,
          resolved as SelectTypeDescriptor,
          schema,
        );
        for (const d of selectDiags) {
          diagnostics.push({
            ...d,
            instanceId: instance.id,
            entityName: instance.typeName,
            attributeName: attrName,
          });
        }
      }
    }

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
    }
  }

  const whereRuleDiags = validateWhereRules(instance, model);
  diagnostics.push(...whereRuleDiags);

  return diagnostics;
}

export function isInstanceComplete(instance: EntityInstance): boolean {
  for (const [attrName, value] of instance.attributes) {
    if (value === undefined) {
      const attrDef = instance.attributeDefinitions.get(attrName);
      if (attrDef && !attrDef.optional) {
        return false;
      }
    }
  }
  return true;
}
