import type {
  EntityDefinition,
  ExpressSchema,
  SchemaRegistry,
} from '@step-nc/express-dictionary';
import {
  getAllAttributes,
  getSupertypeChain,
} from '@step-nc/express-dictionary';
import type { FactoryDiagnostic } from '../diagnostics';
import { errorDiag } from '../diagnostics';
import type { EntityInstance } from '../types/instance';
import type { StepModelOptions } from '../types/model';
import type { AttributeValue, InstanceId } from '../types/values';
import { asInstanceId } from '../types/values';

export interface CreateInstanceResult {
  readonly instance: EntityInstance | undefined;
  readonly diagnostics: FactoryDiagnostic[];
}

export class StepModel {
  readonly schema: ExpressSchema;
  readonly registry?: SchemaRegistry;

  private _nextId: number;
  private readonly _instances = new Map<InstanceId, EntityInstance>();
  private readonly _byType = new Map<string, Set<InstanceId>>();

  constructor(schema: ExpressSchema, options?: StepModelOptions) {
    this.schema = schema;
    if (options?.registry !== undefined) {
      this.registry = options.registry;
    }
    this._nextId = options?.initialId ?? 1;
  }

  get size(): number {
    return this._instances.size;
  }

  getEntityDefinition(entityName: string): EntityDefinition | undefined {
    return this._resolveEntity(entityName);
  }

  getEntityOriginSchema(instance: EntityInstance): string {
    return instance.definition.schema.name;
  }

  createInstance(entityName: string): CreateInstanceResult {
    const id = asInstanceId(this._nextId++);
    return this._createWithId(id, entityName);
  }

  createInstanceWithId(id: number, entityName: string): CreateInstanceResult {
    const instanceId = asInstanceId(id);

    if (this._instances.has(instanceId)) {
      return {
        instance: undefined,
        diagnostics: [
          errorDiag('DUPLICATE_INSTANCE_ID', `Instance #${id} already exists`, {
            instanceId,
            entityName: entityName.toUpperCase(),
          }),
        ],
      };
    }

    if (id >= this._nextId) {
      this._nextId = id + 1;
    }

    return this._createWithId(instanceId, entityName);
  }

  getInstance(id: InstanceId): EntityInstance | undefined {
    return this._instances.get(id);
  }

  getAllInstances(): EntityInstance[] {
    return [...this._instances.values()];
  }

  getInstancesOf(entityName: string, includeSubtypes = true): EntityInstance[] {
    const key = entityName.toUpperCase();

    if (includeSubtypes) {
      const ids = this._byType.get(key);
      if (!ids) return [];
      return [...ids]
        .map((id) => this._instances.get(id))
        .filter((inst): inst is EntityInstance => inst !== undefined);
    }

    return [...this._instances.values()].filter(
      (inst) => inst.typeName === key,
    );
  }

  deleteInstance(id: InstanceId): boolean {
    const instance = this._instances.get(id);
    if (!instance) return false;

    this._instances.delete(id);

    const selfKey = instance.typeName;
    this._byType.get(selfKey)?.delete(id);

    const definition = instance.definition;
    const chain = getSupertypeChain(definition);
    for (const sup of chain) {
      this._byType.get(sup.name.toUpperCase())?.delete(id);
    }

    return true;
  }

  // ── Private ───────────────────────────────────────────────────────

  private _resolveEntity(name: string): EntityDefinition | undefined {
    return this.schema.entities.get(name.toUpperCase());
  }

  private _createWithId(
    id: InstanceId,
    entityName: string,
  ): CreateInstanceResult {
    const definition = this._resolveEntity(entityName);
    if (!definition) {
      return {
        instance: undefined,
        diagnostics: [
          errorDiag(
            'UNKNOWN_ENTITY',
            `Entity '${entityName}' not found in schema '${this.schema.name}'`,
            { instanceId: id, entityName: entityName.toUpperCase() },
          ),
        ],
      };
    }

    if (definition.abstract || !definition.instantiable) {
      return {
        instance: undefined,
        diagnostics: [
          errorDiag(
            'ABSTRACT_INSTANTIATION',
            `Cannot instantiate abstract entity '${definition.name}'`,
            { instanceId: id, entityName: definition.name.toUpperCase() },
          ),
        ],
      };
    }

    const allAttrs = getAllAttributes(definition);
    const attributes = new Map<string, AttributeValue | undefined>();
    const attributeDefinitions = new Map(
      allAttrs.map((a) => [a.name.toUpperCase(), a]),
    );
    for (const attr of allAttrs) {
      attributes.set(attr.name.toUpperCase(), undefined);
    }

    const instance: EntityInstance = {
      id,
      definition,
      typeName: definition.name.toUpperCase(),
      attributes,
      attributeDefinitions,
    };

    this._instances.set(id, instance);
    this._registerByType(id, definition);

    return { instance, diagnostics: [] };
  }

  private _registerByType(id: InstanceId, definition: EntityDefinition): void {
    const selfKey = definition.name.toUpperCase();
    this._getOrCreateTypeSet(selfKey).add(id);

    const chain = getSupertypeChain(definition);
    for (const sup of chain) {
      this._getOrCreateTypeSet(sup.name.toUpperCase()).add(id);
    }
  }

  private _getOrCreateTypeSet(key: string): Set<InstanceId> {
    let set = this._byType.get(key);
    if (!set) {
      set = new Set();
      this._byType.set(key, set);
    }
    return set;
  }
}
