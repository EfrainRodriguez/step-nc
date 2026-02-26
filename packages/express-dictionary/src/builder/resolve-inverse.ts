import type { SchemaDiagnostic } from '../diagnostics';
import { errorDiagnostic } from '../diagnostics';
import type { ExplicitAttribute } from '../types/attribute';
import type { EntityDefinition } from '../types/entity';
import type { ExpressSchema } from '../types/schema';

export function resolveInverse(schema: ExpressSchema): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = [];

  for (const entity of schema.entities.values()) {
    for (const invAttr of entity.inverseAttributes) {
      const targetKey = invAttr.invertedEntityName.toUpperCase();
      const targetEntity = schema.entities.get(targetKey);

      if (!targetEntity) {
        diagnostics.push(
          errorDiagnostic(
            'INVALID_INVERSE',
            `Inverse attribute "${invAttr.name}" on "${entity.name}" references unknown entity "${invAttr.invertedEntityName}"`,
            {
              schemaName: schema.name,
              entityName: entity.name,
              attributeName: invAttr.name,
            },
          ),
        );
        continue;
      }

      invAttr.invertedEntity = targetEntity;

      const targetAttr = findAttribute(
        targetEntity,
        invAttr.invertedAttributeName,
        schema,
      );
      if (!targetAttr) {
        diagnostics.push(
          errorDiagnostic(
            'INVALID_INVERSE',
            `Inverse attribute "${invAttr.name}" on "${entity.name}" references unknown attribute "${invAttr.invertedAttributeName}" on entity "${targetEntity.name}"`,
            {
              schemaName: schema.name,
              entityName: entity.name,
              attributeName: invAttr.name,
            },
          ),
        );
        continue;
      }

      invAttr.invertedAttribute = targetAttr;
    }
  }

  return diagnostics;
}

/**
 * Re-resolve only INVERSE attributes that were left unresolved during initial build.
 * Called after resolveInterfaces() imports cross-schema entities.
 */
export function resolveUnresolvedInverses(
  schema: ExpressSchema,
): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = [];

  for (const entity of schema.entities.values()) {
    for (const invAttr of entity.inverseAttributes) {
      if (invAttr.invertedEntity && invAttr.invertedAttribute) continue;

      const targetKey = invAttr.invertedEntityName.toUpperCase();
      const targetEntity = schema.entities.get(targetKey);

      if (!targetEntity) {
        diagnostics.push(
          errorDiagnostic(
            'INVALID_INVERSE',
            `Inverse attribute "${invAttr.name}" on "${entity.name}" references unknown entity "${invAttr.invertedEntityName}" (cross-schema resolution failed)`,
            {
              schemaName: schema.name,
              entityName: entity.name,
              attributeName: invAttr.name,
            },
          ),
        );
        continue;
      }

      invAttr.invertedEntity = targetEntity;

      const targetAttr = findAttribute(
        targetEntity,
        invAttr.invertedAttributeName,
        schema,
      );
      if (!targetAttr) {
        diagnostics.push(
          errorDiagnostic(
            'INVALID_INVERSE',
            `Inverse attribute "${invAttr.name}" on "${entity.name}" references unknown attribute "${invAttr.invertedAttributeName}" on entity "${targetEntity.name}"`,
            {
              schemaName: schema.name,
              entityName: entity.name,
              attributeName: invAttr.name,
            },
          ),
        );
        continue;
      }

      invAttr.invertedAttribute = targetAttr;
    }
  }

  return diagnostics;
}

/**
 * Find an explicit attribute by name on an entity, including inherited attributes.
 */
function findAttribute(
  entity: EntityDefinition,
  attrName: string,
  schema: ExpressSchema,
): ExplicitAttribute | undefined {
  const key = attrName.toUpperCase();

  // Search own attributes
  const ownAttr = entity.explicitAttributes.find(
    (a) => a.name.toUpperCase() === key,
  );
  if (ownAttr) return ownAttr;

  // Search inherited attributes
  for (const supertype of entity.supertypes) {
    const inherited = findAttribute(supertype, attrName, schema);
    if (inherited) return inherited;
  }

  return undefined;
}
