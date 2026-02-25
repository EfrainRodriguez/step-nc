import type {
  AggregationTypeDescriptor,
  ExpressSchema,
  TypeDescriptor,
} from '@step-nc/express-dictionary';
import {
  getEntity,
  isSubtypeOf,
  resolveToBaseType,
} from '@step-nc/express-dictionary';
import type { AttributeValue } from '../types/values';
import {
  isInstanceRef,
  isSelectValue,
  isStepAggregation,
} from '../types/values';

export function isValueCompatible(
  descriptor: TypeDescriptor,
  value: AttributeValue,
  schema: ExpressSchema,
): boolean {
  const resolved = resolveToBaseType(descriptor);

  switch (resolved.kind) {
    case 'simple':
      return isSimpleCompatible(resolved.simpleType, value);

    case 'enumeration':
      return (
        typeof value === 'string' &&
        resolved.values.some(
          (v) => v.toUpperCase() === (value as string).toUpperCase(),
        )
      );

    case 'entity':
      return isEntityRefCompatible(resolved.entity.name, value, schema);

    case 'select':
      return isSelectCompatible(resolved, value, schema);

    case 'aggregation':
      return isAggregationCompatible(resolved, value, schema);

    case 'generic':
    case 'genericEntity':
      return true;

    case 'unresolved':
      return true;

    default:
      return false;
  }
}

export function getExpectedTypeName(descriptor: TypeDescriptor): string {
  const resolved = resolveToBaseType(descriptor);

  switch (resolved.kind) {
    case 'simple':
      return resolved.simpleType;
    case 'enumeration':
      return `ENUMERATION(${resolved.values.join(', ')})`;
    case 'entity':
      return resolved.entity.name.toUpperCase();
    case 'select':
      return `SELECT(${resolved.selections.map((s) => s.name).join(', ')})`;
    case 'aggregation':
      return `${resolved.aggregationKind} OF ${getExpectedTypeName(resolved.elementType)}`;
    case 'defined':
      return resolved.definition.name.toUpperCase();
    case 'generic':
      return 'GENERIC';
    case 'genericEntity':
      return 'GENERIC_ENTITY';
    case 'unresolved':
      return `UNRESOLVED(${resolved.name})`;
    default:
      return 'UNKNOWN';
  }
}

function isSimpleCompatible(
  simpleType: string,
  value: AttributeValue,
): boolean {
  switch (simpleType) {
    case 'INTEGER':
      return typeof value === 'number' && Number.isInteger(value);
    case 'REAL':
    case 'NUMBER':
      return typeof value === 'number';
    case 'STRING':
      return typeof value === 'string';
    case 'BOOLEAN':
      return typeof value === 'boolean';
    case 'LOGICAL':
      return typeof value === 'boolean' || value === null;
    case 'BINARY':
      return value instanceof Uint8Array;
    default:
      return false;
  }
}

function isEntityRefCompatible(
  expectedEntityName: string,
  value: AttributeValue,
  schema: ExpressSchema,
): boolean {
  if (!isInstanceRef(value)) return false;

  const expectedKey = expectedEntityName.toUpperCase();
  const actualKey = value.entityName.toUpperCase();

  if (expectedKey === actualKey) return true;

  const expectedDef = getEntity(schema, expectedKey);
  const actualDef = getEntity(schema, actualKey);
  if (!expectedDef || !actualDef) return false;

  return isSubtypeOf(actualDef, expectedDef);
}

function isSelectCompatible(
  descriptor: TypeDescriptor,
  value: AttributeValue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  schema: ExpressSchema,
): boolean {
  if (!isSelectValue(value)) return false;
  if (descriptor.kind !== 'select') return false;

  const selections = descriptor.selections;
  if (value.typePath.length < 2) return false;

  const leafName = value.typePath[value.typePath.length - 1]!.toUpperCase();

  return selections.some((s) => s.name.toUpperCase() === leafName);
}

function isAggregationCompatible(
  descriptor: AggregationTypeDescriptor,
  value: AttributeValue,
  schema: ExpressSchema,
): boolean {
  if (!isStepAggregation(value)) return false;

  const kindMap: Record<string, string> = {
    LIST: 'list',
    SET: 'set',
    BAG: 'bag',
    ARRAY: 'array',
  };

  if (value.kind !== kindMap[descriptor.aggregationKind]) return false;

  for (const element of value.elements) {
    if (element === null) continue;
    if (
      !isValueCompatible(
        descriptor.elementType,
        element as AttributeValue,
        schema,
      )
    ) {
      return false;
    }
  }

  return true;
}
