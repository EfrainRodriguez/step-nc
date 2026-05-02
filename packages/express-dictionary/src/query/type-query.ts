import type { TypeDefinition } from '../types/type-definition';
import type { SelectionItem, TypeDescriptor } from '../types/type-descriptor';

/**
 * Follow defined type aliases until a non-defined-type leaf is reached.
 * e.g. length_measure → REAL → SimpleTypeDescriptor
 */
export function resolveToBaseType(descriptor: TypeDescriptor): TypeDescriptor {
  if (descriptor.kind === 'defined') {
    const def = descriptor.definition as TypeDefinition;
    if ('underlyingType' in def) {
      return resolveToBaseType(def.underlyingType);
    }
  }
  return descriptor;
}

export function isEntityType(descriptor: TypeDescriptor): boolean {
  return descriptor.kind === 'entity';
}

export function isAggregationType(descriptor: TypeDescriptor): boolean {
  return descriptor.kind === 'aggregation';
}

export function isSelectType(descriptor: TypeDescriptor): boolean {
  return descriptor.kind === 'select';
}

export function isEnumerationType(descriptor: TypeDescriptor): boolean {
  return descriptor.kind === 'enumeration';
}

export function isSimpleType(descriptor: TypeDescriptor): boolean {
  return descriptor.kind === 'simple';
}

/**
 * Recursively flatten SELECT options, expanding nested SELECTs.
 */
export function getSelectOptions(descriptor: TypeDescriptor): SelectionItem[] {
  if (descriptor.kind !== 'select') return [];

  const result: SelectionItem[] = [];
  for (const sel of descriptor.selections) {
    if (sel.resolved && 'underlyingType' in sel.resolved) {
      const typeDef = sel.resolved as TypeDefinition;
      if (typeDef.underlyingType.kind === 'select') {
        result.push(...getSelectOptions(typeDef.underlyingType));
        continue;
      }
    }
    result.push(sel);
  }
  return result;
}
