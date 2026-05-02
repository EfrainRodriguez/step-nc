import { resolveUnresolvedInverses } from '../builder/resolve-inverse';
import { resolveTypes } from '../builder/resolve-types';
import type { SchemaDiagnostic } from '../diagnostics';
import { errorDiagnostic } from '../diagnostics';
import type { ExpressSchema } from '../types/schema';

export function resolveInterfaces(
  schemas: Map<string, ExpressSchema>,
): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = [];

  for (const schema of schemas.values()) {
    for (const iface of schema.interfaces) {
      const sourceKey = iface.schemaName.toUpperCase();
      const sourceSchema = schemas.get(sourceKey);

      if (!sourceSchema) {
        diagnostics.push(
          errorDiagnostic(
            'UNRESOLVED_SCHEMA_REF',
            `Schema "${iface.schemaName}" not found (referenced by "${schema.name}")`,
            { schemaName: schema.name },
          ),
        );
        continue;
      }

      if (!iface.items || iface.items.length === 0) {
        // Import everything from source schema
        importAll(schema, sourceSchema, iface.kind);
      } else {
        for (const item of iface.items) {
          const itemKey = item.name.toUpperCase();
          const localName = item.alias ?? item.name;
          const localKey = localName.toUpperCase();

          const entity = sourceSchema.entities.get(itemKey);
          const typeDef = sourceSchema.types.get(itemKey);

          if (entity) {
            schema.entities.set(localKey, entity);
          } else if (typeDef) {
            schema.types.set(localKey, typeDef);
          } else {
            diagnostics.push(
              errorDiagnostic(
                'UNRESOLVED_INTERFACE_ITEM',
                `Item "${item.name}" not found in schema "${sourceSchema.name}"`,
                { schemaName: schema.name },
              ),
            );
          }
        }
      }
    }
  }

  // Re-resolve types for all schemas that had interfaces
  for (const schema of schemas.values()) {
    if (schema.interfaces.length > 0) {
      const resolveDiags = resolveTypes(schema);
      diagnostics.push(...resolveDiags);
    }
  }

  // Re-resolve inverse attributes that couldn't be resolved during initial build
  // because the target entity was in a different schema (now imported).
  // Run for all schemas so we also emit INVALID_INVERSE for still-unresolved inverses.
  for (const schema of schemas.values()) {
    const inverseDiags = resolveUnresolvedInverses(schema);
    diagnostics.push(...inverseDiags);
  }

  return diagnostics;
}

function importAll(
  target: ExpressSchema,
  source: ExpressSchema,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _kind: 'use' | 'reference',
): void {
  for (const [key, entity] of source.entities) {
    if (!target.entities.has(key)) {
      target.entities.set(key, entity);
    }
  }
  for (const [key, typeDef] of source.types) {
    if (!target.types.has(key)) {
      target.types.set(key, typeDef);
    }
  }
}
