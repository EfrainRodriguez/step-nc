import type { EntityDefinition } from '../types/entity';
import type { ExpressSchema } from '../types/schema';
import type { TypeDefinition } from '../types/type-definition';

export function getEntity(
  schema: ExpressSchema,
  name: string,
): EntityDefinition | undefined {
  return schema.entities.get(name.toUpperCase());
}

export function getType(
  schema: ExpressSchema,
  name: string,
): TypeDefinition | undefined {
  return schema.types.get(name.toUpperCase());
}

export function getNamedType(
  schema: ExpressSchema,
  name: string,
): EntityDefinition | TypeDefinition | undefined {
  const key = name.toUpperCase();
  return schema.entities.get(key) ?? schema.types.get(key);
}

export function getAllEntities(schema: ExpressSchema): EntityDefinition[] {
  return [...schema.entities.values()];
}

export function getAllTypes(schema: ExpressSchema): TypeDefinition[] {
  return [...schema.types.values()];
}

export function getInstantiableEntities(
  schema: ExpressSchema,
): EntityDefinition[] {
  return [...schema.entities.values()].filter((e) => e.instantiable);
}
