import type { SchemaDiagnostic } from '../diagnostics';
import { errorDiagnostic, warningDiagnostic } from '../diagnostics';
import type { EntityDefinition } from '../types/entity';
import type { ExpressSchema } from '../types/schema';

export function buildInheritance(schema: ExpressSchema): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = [];

  // Phase 1: Resolve supertype references (string → EntityDefinition)
  for (const entity of schema.entities.values()) {
    for (const supertypeName of entity.supertypeNames) {
      const key = supertypeName.toUpperCase();
      const superEntity = schema.entities.get(key);
      if (!superEntity) {
        diagnostics.push(
          errorDiagnostic(
            'UNRESOLVED_ENTITY_REF',
            `Supertype "${supertypeName}" not found for entity "${entity.name}"`,
            { schemaName: schema.name, entityName: entity.name },
          ),
        );
        continue;
      }
      entity.supertypes.push(superEntity);
    }
  }

  // Phase 2: Compute subtypes (inverse of supertypes)
  for (const entity of schema.entities.values()) {
    for (const supertype of entity.supertypes) {
      if (!supertype.subtypes.includes(entity)) {
        supertype.subtypes.push(entity);
      }
    }
  }

  // Phase 3: Detect circular inheritance
  for (const entity of schema.entities.values()) {
    if (hasCircularInheritance(entity)) {
      diagnostics.push(
        errorDiagnostic(
          'CIRCULAR_INHERITANCE',
          `Circular inheritance detected for entity "${entity.name}"`,
          { schemaName: schema.name, entityName: entity.name },
        ),
      );
    }
  }

  // Phase 4: Process SubtypeConstraintDeclarations
  for (const constraint of schema.subtypeConstraints.values()) {
    const key = constraint.entityName.toUpperCase();
    const targetEntity = schema.entities.get(key);
    if (!targetEntity) {
      diagnostics.push(
        errorDiagnostic(
          'UNRESOLVED_ENTITY_REF',
          `SubtypeConstraint "${constraint.name}" targets unknown entity "${constraint.entityName}"`,
          { schemaName: schema.name, entityName: constraint.entityName },
        ),
      );
      continue;
    }
    constraint.entity = targetEntity;

    if (constraint.abstractSupertype) {
      targetEntity.instantiable = false;
    }
  }

  // Phase 5: Compute instantiable flag
  for (const entity of schema.entities.values()) {
    if (entity.abstract) {
      entity.instantiable = false;
    }
  }

  // Phase 6: Validate derived attribute redeclarations
  for (const entity of schema.entities.values()) {
    for (const derived of entity.derivedAttributes) {
      if (!derived.redeclaredFrom) continue;

      const superKey = derived.redeclaredFrom.entityName.toUpperCase();
      const superEntity = schema.entities.get(superKey);
      if (!superEntity) {
        diagnostics.push(
          warningDiagnostic(
            'UNRESOLVED_ENTITY_REF',
            `Derived attribute "${derived.name}" on "${entity.name}" redeclares from unknown entity "${derived.redeclaredFrom.entityName}"`,
            { schemaName: schema.name, entityName: entity.name },
          ),
        );
        continue;
      }

      const attrKey = derived.redeclaredFrom.attributeName.toUpperCase();
      const targetAttr =
        superEntity.explicitAttributes.find(
          (a) => a.name.toUpperCase() === attrKey,
        ) ??
        superEntity.derivedAttributes.find(
          (a) => a.name.toUpperCase() === attrKey,
        );

      if (!targetAttr) {
        diagnostics.push(
          warningDiagnostic(
            'UNRESOLVED_ATTRIBUTE_REF',
            `Derived attribute "${derived.name}" on "${entity.name}" redeclares unknown attribute "${derived.redeclaredFrom.attributeName}" from "${superEntity.name}"`,
            {
              schemaName: schema.name,
              entityName: entity.name,
              attributeName: derived.name,
            },
          ),
        );
      }
    }
  }

  return diagnostics;
}

function hasCircularInheritance(entity: EntityDefinition): boolean {
  const visited = new Set<string>();
  const queue: EntityDefinition[] = [...entity.supertypes];

  while (queue.length > 0) {
    const current = queue.pop()!;
    const key = current.name.toUpperCase();

    if (key === entity.name.toUpperCase()) {
      return true;
    }

    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    for (const supertype of current.supertypes) {
      queue.push(supertype);
    }
  }

  return false;
}
