import type { EntityInstance } from '../types/instance';
import type { AttributeValue, InstanceId } from '../types/values';

export interface ModelSnapshot {
  readonly nextId: number;
  readonly instances: Map<InstanceId, EntityInstance>;
  readonly instanceAttributes: Map<
    InstanceId,
    Map<string, AttributeValue | undefined>
  >;
  readonly byType: Map<string, Set<InstanceId>>;
}

export function captureSnapshot(
  instances: Map<InstanceId, EntityInstance>,
  byType: Map<string, Set<InstanceId>>,
  nextId: number,
): ModelSnapshot {
  const snapshotInstances = new Map<InstanceId, EntityInstance>();
  const snapshotAttributes = new Map<
    InstanceId,
    Map<string, AttributeValue | undefined>
  >();

  for (const [id, instance] of instances) {
    snapshotInstances.set(id, instance);
    snapshotAttributes.set(id, new Map(instance.attributes));
  }

  const snapshotByType = new Map<string, Set<InstanceId>>();
  for (const [key, set] of byType) {
    snapshotByType.set(key, new Set(set));
  }

  return {
    nextId,
    instances: snapshotInstances,
    instanceAttributes: snapshotAttributes,
    byType: snapshotByType,
  };
}

export function restoreSnapshot(
  instances: Map<InstanceId, EntityInstance>,
  byType: Map<string, Set<InstanceId>>,
  snapshot: ModelSnapshot,
): number {
  instances.clear();
  for (const [id, instance] of snapshot.instances) {
    const savedAttrs = snapshot.instanceAttributes.get(id);
    if (savedAttrs) {
      const attrs = instance.attributes as Map<
        string,
        AttributeValue | undefined
      >;
      attrs.clear();
      for (const [key, value] of savedAttrs) {
        attrs.set(key, value);
      }
    }
    instance._derivedCache.clear();
    instances.set(id, instance);
  }

  byType.clear();
  for (const [key, set] of snapshot.byType) {
    byType.set(key, new Set(set));
  }

  return snapshot.nextId;
}
