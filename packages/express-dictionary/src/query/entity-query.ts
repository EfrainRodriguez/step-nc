import type {
  DerivedAttribute,
  ExplicitAttribute,
  InverseAttribute,
} from '../types/attribute';
import type { EntityDefinition } from '../types/entity';

export function getAllAttributes(
  entity: EntityDefinition,
): ExplicitAttribute[] {
  const result: ExplicitAttribute[] = [];
  const seen = new Set<string>();

  collectAttributes(entity, result, seen);

  return result;
}

function collectAttributes(
  entity: EntityDefinition,
  result: ExplicitAttribute[],
  seen: Set<string>,
): void {
  // Collect inherited attributes first (depth-first through supertypes)
  for (const supertype of entity.supertypes) {
    collectAttributes(supertype, result, seen);
  }

  // Then own attributes (which may override inherited ones)
  for (const attr of entity.explicitAttributes) {
    const key = attr.name.toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(attr);
    }
  }
}

export function getOwnAttributes(
  entity: EntityDefinition,
): ExplicitAttribute[] {
  return [...entity.explicitAttributes];
}

export function getInheritedAttributes(
  entity: EntityDefinition,
): ExplicitAttribute[] {
  const all = getAllAttributes(entity);
  const ownNames = new Set(
    entity.explicitAttributes.map((a) => a.name.toUpperCase()),
  );
  return all.filter((a) => !ownNames.has(a.name.toUpperCase()));
}

export function getAllDerivedAttributes(
  entity: EntityDefinition,
): DerivedAttribute[] {
  const result: DerivedAttribute[] = [];
  const seen = new Set<string>();

  collectDerived(entity, result, seen);

  return result;
}

function collectDerived(
  entity: EntityDefinition,
  result: DerivedAttribute[],
  seen: Set<string>,
): void {
  for (const supertype of entity.supertypes) {
    collectDerived(supertype, result, seen);
  }
  for (const attr of entity.derivedAttributes) {
    const key = attr.name.toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(attr);
    }
  }
}

export function getAllInverseAttributes(
  entity: EntityDefinition,
): InverseAttribute[] {
  const result: InverseAttribute[] = [];
  const seen = new Set<string>();

  collectInverse(entity, result, seen);

  return result;
}

function collectInverse(
  entity: EntityDefinition,
  result: InverseAttribute[],
  seen: Set<string>,
): void {
  for (const supertype of entity.supertypes) {
    collectInverse(supertype, result, seen);
  }
  for (const attr of entity.inverseAttributes) {
    const key = attr.name.toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(attr);
    }
  }
}

export function getSupertypeChain(
  entity: EntityDefinition,
): EntityDefinition[] {
  const chain: EntityDefinition[] = [];
  const visited = new Set<string>();

  function walk(e: EntityDefinition): void {
    for (const supertype of e.supertypes) {
      const key = supertype.name.toUpperCase();
      if (!visited.has(key)) {
        visited.add(key);
        chain.push(supertype);
        walk(supertype);
      }
    }
  }

  walk(entity);
  return chain;
}

export function getAllSubtypes(entity: EntityDefinition): EntityDefinition[] {
  const result: EntityDefinition[] = [];
  const visited = new Set<string>();

  function walk(e: EntityDefinition): void {
    for (const subtype of e.subtypes) {
      const key = subtype.name.toUpperCase();
      if (!visited.has(key)) {
        visited.add(key);
        result.push(subtype);
        walk(subtype);
      }
    }
  }

  walk(entity);
  return result;
}

export function getDirectSubtypes(
  entity: EntityDefinition,
): EntityDefinition[] {
  return [...entity.subtypes];
}

export function isSubtypeOf(
  entity: EntityDefinition,
  supertype: EntityDefinition,
): boolean {
  const supertypeKey = supertype.name.toUpperCase();
  const chain = getSupertypeChain(entity);
  return chain.some((e) => e.name.toUpperCase() === supertypeKey);
}

export function isInstantiable(entity: EntityDefinition): boolean {
  return entity.instantiable;
}
