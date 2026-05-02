import type { SchemaDiagnostic } from '../diagnostics';
import { warningDiagnostic } from '../diagnostics';
import type { EntityDefinition } from '../types/entity';
import type { ExpressSchema } from '../types/schema';

/**
 * Walk the inheritance chain (own + supertypes) to find an explicit attribute
 * by name. Uses a visited set to guard against diamond inheritance cycles.
 */
function findAttributeInChain(
  entity: EntityDefinition,
  attrName: string,
  visited: Set<string> = new Set(),
): { name: string } | undefined {
  const entityKey = entity.name.toUpperCase();
  if (visited.has(entityKey)) return undefined;
  visited.add(entityKey);

  const key = attrName.toUpperCase();

  const ownAttr = entity.explicitAttributes.find(
    (a) => a.name.toUpperCase() === key,
  );
  if (ownAttr) return { name: ownAttr.name };

  for (const supertype of entity.supertypes) {
    const inherited = findAttributeInChain(supertype, attrName, visited);
    if (inherited) return inherited;
  }

  return undefined;
}

export function resolveConstraints(schema: ExpressSchema): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = [];

  for (const entity of schema.entities.values()) {
    for (const uniqueRule of entity.uniqueRules) {
      const resolved: { name: string }[] = [];
      for (const attrName of uniqueRule.attributeNames) {
        const attr = findAttributeInChain(entity, attrName);
        if (attr) {
          resolved.push(attr);
        } else {
          diagnostics.push(
            warningDiagnostic(
              'UNRESOLVED_ATTRIBUTE_REF',
              `Unique rule "${uniqueRule.label ?? '(unnamed)'}" on "${entity.name}" references unknown attribute "${attrName}"`,
              {
                schemaName: schema.name,
                entityName: entity.name,
                attributeName: attrName,
              },
            ),
          );
        }
      }
      uniqueRule.resolvedAttributes = resolved;
    }
  }

  return diagnostics;
}
