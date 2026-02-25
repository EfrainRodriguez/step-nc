import type { SchemaDiagnostic } from '../diagnostics';
import { warningDiagnostic } from '../diagnostics';
import type { ExpressSchema } from '../types/schema';

export function resolveConstraints(schema: ExpressSchema): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = [];

  for (const entity of schema.entities.values()) {
    for (const uniqueRule of entity.uniqueRules) {
      const resolved: { name: string }[] = [];
      for (const attrName of uniqueRule.attributeNames) {
        const key = attrName.toUpperCase();
        const attr = entity.explicitAttributes.find(
          (a) => a.name.toUpperCase() === key,
        );
        if (attr) {
          resolved.push({ name: attr.name });
        } else {
          diagnostics.push(
            warningDiagnostic(
              'DUPLICATE_ATTRIBUTE',
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
