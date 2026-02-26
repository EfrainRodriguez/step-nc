import type {
  EntityDefinition,
  ExplicitAttribute,
  ExpressSchema,
} from '@step-nc/express-dictionary';
import {
  getAllAttributes,
  getAllDerivedAttributes,
  getOwnAttributes,
} from '@step-nc/express-dictionary';
import type { EntityInstance } from '@step-nc/step-factory';
import type { WriterDiagnostic } from './diagnostics';
import { serializeAttributeValue } from './serialize-value';

export interface SerializeInstanceResult {
  text: string;
  diagnostics: WriterDiagnostic[];
}

interface EntityComponent {
  definition: EntityDefinition;
  ownAttributes: ExplicitAttribute[];
}

export function isComplexEntity(definition: EntityDefinition): boolean {
  const visited = new Set<string>();

  function walk(entity: EntityDefinition): boolean {
    const key = entity.name.toUpperCase();
    if (visited.has(key)) return false;
    visited.add(key);

    if (entity.supertypes.length > 1) return true;

    for (const supertype of entity.supertypes) {
      if (walk(supertype)) return true;
    }

    return false;
  }

  return walk(definition);
}

export function getEntityComponents(
  definition: EntityDefinition,
): EntityComponent[] {
  const all = new Map<string, EntityDefinition>();

  function collect(entity: EntityDefinition): void {
    const key = entity.name.toUpperCase();
    if (all.has(key)) return;
    all.set(key, entity);
    for (const supertype of entity.supertypes) {
      collect(supertype);
    }
  }

  collect(definition);

  const sorted = [...all.values()].sort((a, b) =>
    a.name.toUpperCase().localeCompare(b.name.toUpperCase()),
  );

  return sorted.map((entity) => ({
    definition: entity,
    ownAttributes: getOwnAttributes(entity),
  }));
}

function isDerivedInContext(
  attrName: string,
  leafDefinition: EntityDefinition,
): boolean {
  const key = attrName.toUpperCase();

  const allDerived = getAllDerivedAttributes(leafDefinition);
  return allDerived.some((d) => d.name.toUpperCase() === key);
}

function serializeSimpleInstance(
  instance: EntityInstance,
  schema?: ExpressSchema,
): SerializeInstanceResult {
  const diagnostics: WriterDiagnostic[] = [];
  const allAttrs = getAllAttributes(instance.definition);
  const params: string[] = [];

  for (const attr of allAttrs) {
    const attrKey = attr.name.toUpperCase();

    if (isDerivedInContext(attrKey, instance.definition)) {
      params.push('*');
      continue;
    }

    const value = instance.attributes.get(attrKey);
    const result = serializeAttributeValue(value, attr.type, schema);
    params.push(result.text);
    diagnostics.push(...result.diagnostics);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const _d of getAllDerivedAttributes(instance.definition)) {
    params.push('*');
  }

  const text = `#${instance.id}=${instance.typeName}(${params.join(',')});`;
  return { text, diagnostics };
}

function serializeComplexInstance(
  instance: EntityInstance,
  schema?: ExpressSchema,
): SerializeInstanceResult {
  const diagnostics: WriterDiagnostic[] = [];
  const components = getEntityComponents(instance.definition);
  const componentTexts: string[] = [];

  for (const component of components) {
    const params: string[] = [];

    for (const attr of component.ownAttributes) {
      const attrKey = attr.name.toUpperCase();

      if (isDerivedInContext(attrKey, instance.definition)) {
        params.push('*');
        continue;
      }

      const value = instance.attributes.get(attrKey);
      const result = serializeAttributeValue(value, attr.type, schema);
      params.push(result.text);
      diagnostics.push(...result.diagnostics);
    }

    componentTexts.push(
      `${component.definition.name.toUpperCase()}(${params.join(',')})`,
    );
  }

  const text = `#${instance.id}=(${componentTexts.join(' ')});`;
  return { text, diagnostics };
}

export function serializeInstance(
  instance: EntityInstance,
  schema?: ExpressSchema,
): SerializeInstanceResult {
  if (isComplexEntity(instance.definition)) {
    return serializeComplexInstance(instance, schema);
  }
  return serializeSimpleInstance(instance, schema);
}
