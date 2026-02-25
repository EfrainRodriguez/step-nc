import type { ExpressSchema } from '@step-nc/express-dictionary';
import type { FactoryDiagnostic } from '../diagnostics';
import { errorDiag } from '../diagnostics';
import type { EntityInstance } from '../types/instance';
import type { AttributeValue } from '../types/values';
import { getExpectedTypeName, isValueCompatible } from './type-mapping';

export function getAttribute(
  instance: EntityInstance,
  attrName: string,
): AttributeValue | undefined {
  return instance.attributes.get(attrName.toUpperCase());
}

export function hasAttribute(
  instance: EntityInstance,
  attrName: string,
): boolean {
  return instance.attributes.has(attrName.toUpperCase());
}

export function setAttribute(
  instance: EntityInstance,
  attrName: string,
  value: AttributeValue,
  schema?: ExpressSchema,
): FactoryDiagnostic[] {
  const key = attrName.toUpperCase();
  const diagnostics: FactoryDiagnostic[] = [];

  if (!instance.attributes.has(key)) {
    diagnostics.push(
      errorDiag(
        'UNKNOWN_ATTRIBUTE',
        `Attribute '${attrName}' not found on entity '${instance.typeName}'`,
        {
          instanceId: instance.id,
          entityName: instance.typeName,
          attributeName: key,
        },
      ),
    );
    return diagnostics;
  }

  if (schema && value !== null && value !== undefined) {
    const attrDef = instance.attributeDefinitions.get(key);
    if (attrDef && !isValueCompatible(attrDef.type, value, schema)) {
      diagnostics.push(
        errorDiag(
          'TYPE_MISMATCH',
          `Attribute '${key}' expects ${getExpectedTypeName(attrDef.type)}, got incompatible value`,
          {
            instanceId: instance.id,
            entityName: instance.typeName,
            attributeName: key,
          },
        ),
      );
      return diagnostics;
    }
  }

  (instance.attributes as Map<string, AttributeValue | undefined>).set(
    key,
    value,
  );
  return diagnostics;
}

export function setAttributes(
  instance: EntityInstance,
  values: Record<string, AttributeValue>,
  schema?: ExpressSchema,
): FactoryDiagnostic[] {
  const diagnostics: FactoryDiagnostic[] = [];
  for (const [name, value] of Object.entries(values)) {
    const diags = setAttribute(instance, name, value, schema);
    if (diags.length > 0) {
      diagnostics.push(...diags);
    }
  }
  return diagnostics;
}

export function getAttributeNames(instance: EntityInstance): string[] {
  return [...instance.attributes.keys()];
}

export function getUnsetRequiredAttributes(instance: EntityInstance): string[] {
  const unset: string[] = [];
  for (const [key, value] of instance.attributes) {
    if (value === undefined) {
      const attrDef = instance.attributeDefinitions.get(key);
      if (attrDef && !attrDef.optional) {
        unset.push(key);
      }
    }
  }
  return unset;
}
