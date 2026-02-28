import type {
  EntityDefinition,
  ExplicitAttribute,
  ExpressSchema,
} from '@step-nc/express-dictionary';
import {
  getAllAttributes,
  getOwnAttributes,
  getSupertypeChain,
} from '@step-nc/express-dictionary';
import type {
  ComplexEntityInstanceNode,
  DataSectionNode,
  EntityInstanceNode,
  SimpleEntityInstanceNode,
  SimpleRecordNode,
} from '@step-nc/p21-parser';
import type { EntityInstance } from '@step-nc/step-factory';
import { asInstanceId, StepModel } from '@step-nc/step-factory';
import type { ReaderDiagnostic } from './diagnostics';
import { errorDiag, warningDiag } from './diagnostics';
import { convertParameter } from './parameter-converter';
import { resolveRefsInValue } from './resolve-refs';

export interface LoadEntitiesResult {
  diagnostics: ReaderDiagnostic[];
}

export function loadEntities(
  dataSections: readonly DataSectionNode[],
  schema: ExpressSchema,
  model: StepModel,
  strictRefs: boolean,
): LoadEntitiesResult {
  const diagnostics: ReaderDiagnostic[] = [];

  // Phase 1 & 2 metadata: track which AST entities were successfully created
  const created: Array<{
    entity: EntityInstanceNode;
    definition: EntityDefinition;
    instance: EntityInstance;
  }> = [];

  // ── Phase 1: Create all instances (empty) ──────────────────────────
  for (const section of dataSections) {
    for (const entity of section.entities) {
      const entityName = resolveEntityName(entity, schema);
      if (!entityName) {
        const rawName = getRawEntityName(entity);
        diagnostics.push(
          errorDiag(
            'UNKNOWN_ENTITY',
            `Entity '${rawName}' not found in schema`,
            {
              instanceId: asInstanceId(entity.id),
              entityName: rawName.toUpperCase(),
            },
          ),
        );
        continue;
      }

      const definition = schema.entities.get(entityName.toUpperCase());
      if (!definition) {
        diagnostics.push(
          errorDiag(
            'UNKNOWN_ENTITY',
            `Entity '${entityName}' not found in schema`,
            {
              instanceId: asInstanceId(entity.id),
              entityName: entityName.toUpperCase(),
            },
          ),
        );
        continue;
      }

      if (
        entity.type === 'SimpleEntityInstance' &&
        (definition.abstract || !definition.instantiable)
      ) {
        diagnostics.push(
          errorDiag(
            'ABSTRACT_ENTITY',
            `Cannot instantiate abstract entity '${entityName}'`,
            {
              instanceId: asInstanceId(entity.id),
              entityName: entityName.toUpperCase(),
            },
          ),
        );
        continue;
      }

      const result = model.createInstanceWithId(entity.id, entityName);
      if (!result.instance) {
        for (const d of result.diagnostics) {
          const code =
            d.code === 'DUPLICATE_INSTANCE_ID'
              ? 'DUPLICATE_INSTANCE_ID'
              : 'UNKNOWN_ENTITY';
          diagnostics.push(
            errorDiag(
              code as 'DUPLICATE_INSTANCE_ID' | 'UNKNOWN_ENTITY',
              d.message,
              {
                instanceId: asInstanceId(entity.id),
                entityName: entityName.toUpperCase(),
              },
            ),
          );
        }
        continue;
      }

      created.push({ entity, definition, instance: result.instance });
    }
  }

  // ── Phase 2: Populate attributes ───────────────────────────────────
  for (const { entity, definition, instance } of created) {
    if (entity.type === 'SimpleEntityInstance') {
      const attrDiags = populateSimpleEntity(
        entity,
        definition,
        instance,
        schema,
        model,
        strictRefs,
      );
      diagnostics.push(...attrDiags);
    } else {
      const attrDiags = populateComplexEntity(
        entity,
        definition,
        instance,
        schema,
        model,
        strictRefs,
      );
      diagnostics.push(...attrDiags);
    }
  }

  return { diagnostics };
}

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Determine the entity type name from a P21 entity instance.
 * - Simple: the record keyword
 * - Complex: find the leaf entity whose supertype chain covers ALL records
 */
function resolveEntityName(
  entity: EntityInstanceNode,
  schema: ExpressSchema,
): string | undefined {
  if (entity.type === 'SimpleEntityInstance') {
    const name = entity.record.keyword.toUpperCase();
    return schema.entities.has(name) ? name : undefined;
  }

  // Complex: try to find a leaf entity that covers all record keywords
  const recordNames = new Set(
    entity.records.map((r) => r.keyword.toUpperCase()),
  );

  for (const [, def] of schema.entities) {
    if (!def.instantiable) continue;
    const chain = getSupertypeChain(def);
    const coverage = new Set(chain.map((e) => e.name.toUpperCase()));
    coverage.add(def.name.toUpperCase());

    if ([...recordNames].every((n) => coverage.has(n))) {
      return def.name;
    }
  }

  // Fallback: last record keyword
  const last = entity.records[entity.records.length - 1];
  return last ? last.keyword.toUpperCase() : undefined;
}

function getRawEntityName(entity: EntityInstanceNode): string {
  if (entity.type === 'SimpleEntityInstance') {
    return entity.record.keyword;
  }
  const last = entity.records[entity.records.length - 1];
  return last ? last.keyword : 'UNKNOWN';
}

function populateSimpleEntity(
  entity: SimpleEntityInstanceNode,
  definition: EntityDefinition,
  instance: EntityInstance,
  schema: ExpressSchema,
  model: StepModel,
  strictRefs: boolean,
): ReaderDiagnostic[] {
  const diagnostics: ReaderDiagnostic[] = [];
  const allAttrs = getAllAttributes(definition);
  const params = entity.record.parameters;

  let positionalIndex = 0;

  for (const param of params) {
    if (
      param.type === 'TypedParameter' &&
      isAttributeName(param.keyword, allAttrs)
    ) {
      // Named parameter: keyword matches an attribute name
      const attrName = param.keyword.toUpperCase();
      const attrDef = allAttrs.find((a) => a.name.toUpperCase() === attrName);
      if (!attrDef) continue;

      const ctx = {
        instanceId: instance.id,
        entityName: instance.typeName,
        attributeName: attrName,
      };

      const result = convertParameter(
        param.parameter,
        attrDef.type,
        schema,
        ctx,
      );
      diagnostics.push(...result.diagnostics);

      if (result.value !== null) {
        const resolved = resolveRefsInValue(
          result.value,
          model,
          strictRefs,
          ctx,
          diagnostics,
        );
        model.setAttribute(instance, attrName, resolved, schema);
      }
    } else {
      // Positional parameter
      if (positionalIndex >= allAttrs.length) {
        diagnostics.push(
          warningDiag(
            'EXTRA_PARAMETER',
            `More parameters (${params.length}) than attributes (${allAttrs.length})`,
            { instanceId: instance.id, entityName: instance.typeName },
          ),
        );
        break;
      }

      const attrDef = allAttrs[positionalIndex]!;
      const attrName = attrDef.name.toUpperCase();
      const ctx = {
        instanceId: instance.id,
        entityName: instance.typeName,
        attributeName: attrName,
      };

      const result = convertParameter(param, attrDef.type, schema, ctx);
      diagnostics.push(...result.diagnostics);

      if (result.value !== null) {
        const resolved = resolveRefsInValue(
          result.value,
          model,
          strictRefs,
          ctx,
          diagnostics,
        );
        model.setAttribute(instance, attrName, resolved, schema);
      }

      positionalIndex++;
    }
  }

  return diagnostics;
}

function populateComplexEntity(
  entity: ComplexEntityInstanceNode,
  _definition: EntityDefinition,
  instance: EntityInstance,
  schema: ExpressSchema,
  model: StepModel,
  strictRefs: boolean,
): ReaderDiagnostic[] {
  const diagnostics: ReaderDiagnostic[] = [];

  for (const record of entity.records) {
    const recordDef = schema.entities.get(record.keyword.toUpperCase());
    if (!recordDef) {
      diagnostics.push(
        warningDiag(
          'UNKNOWN_ENTITY',
          `Record entity '${record.keyword}' not found in schema`,
          { instanceId: instance.id, entityName: instance.typeName },
        ),
      );
      continue;
    }

    const ownAttrs = getOwnAttributes(recordDef).filter(
      (attr) => !attr.redeclaring,
    );
    populateRecordAttributes(
      record,
      ownAttrs,
      instance,
      schema,
      model,
      strictRefs,
      diagnostics,
    );
  }

  return diagnostics;
}

function populateRecordAttributes(
  record: SimpleRecordNode,
  attrs: ExplicitAttribute[],
  instance: EntityInstance,
  schema: ExpressSchema,
  model: StepModel,
  strictRefs: boolean,
  diagnostics: ReaderDiagnostic[],
): void {
  const params = record.parameters;

  for (let i = 0; i < params.length && i < attrs.length; i++) {
    const param = params[i]!;
    const attrDef = attrs[i]!;
    const attrName = attrDef.name.toUpperCase();

    const ctx = {
      instanceId: instance.id,
      entityName: instance.typeName,
      attributeName: attrName,
    };

    const result = convertParameter(param, attrDef.type, schema, ctx);
    diagnostics.push(...result.diagnostics);

    if (result.value !== null) {
      const resolved = resolveRefsInValue(
        result.value,
        model,
        strictRefs,
        ctx,
        diagnostics,
      );
      model.setAttribute(instance, attrName, resolved, schema);
    }
  }

  if (params.length > attrs.length) {
    diagnostics.push(
      warningDiag(
        'EXTRA_PARAMETER',
        `Record '${record.keyword}' has ${params.length} parameters but entity defines ${attrs.length} own attributes`,
        { instanceId: instance.id, entityName: instance.typeName },
      ),
    );
  }
}

function isAttributeName(keyword: string, attrs: ExplicitAttribute[]): boolean {
  const upper = keyword.toUpperCase();
  return attrs.some((a) => a.name.toUpperCase() === upper);
}
