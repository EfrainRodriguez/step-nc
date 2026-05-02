import { beforeEach, describe, expect, it } from 'vitest';
import { asInstanceId, setAttribute, StepModel } from '../../src';
import type {
  AttributeChangedEvent,
  InstanceCreatedEvent,
  InstanceDeletedEvent,
} from '../../src/events/model-events';
import { buildTestSchema } from '../fixtures/build-test-schema';

describe('Model Events', () => {
  let model: StepModel;

  beforeEach(() => {
    const schema = buildTestSchema();
    model = new StepModel(schema);
  });

  describe('instance:created', () => {
    it('should emit event with correct id, entityName, and instance', () => {
      const events: InstanceCreatedEvent[] = [];
      model.on('instance:created', (e) => events.push(e));

      const { instance } = model.createInstance('cartesian_point');

      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('instance:created');
      expect(events[0]!.instanceId).toBe(instance!.id);
      expect(events[0]!.entityName).toBe('CARTESIAN_POINT');
      expect(events[0]!.instance).toBe(instance);
    });

    it('should emit for createInstanceWithId', () => {
      const events: InstanceCreatedEvent[] = [];
      model.on('instance:created', (e) => events.push(e));

      const { instance } = model.createInstanceWithId(42, 'direction');

      expect(events).toHaveLength(1);
      expect(events[0]!.instanceId).toBe(42);
      expect(events[0]!.entityName).toBe('DIRECTION');
      expect(events[0]!.instance).toBe(instance);
    });

    it('should NOT emit when entity is unknown', () => {
      const events: InstanceCreatedEvent[] = [];
      model.on('instance:created', (e) => events.push(e));

      model.createInstance('nonexistent_entity');

      expect(events).toHaveLength(0);
    });

    it('should NOT emit when entity is abstract', () => {
      const events: InstanceCreatedEvent[] = [];
      model.on('instance:created', (e) => events.push(e));

      model.createInstance('geometric_representation_item');

      expect(events).toHaveLength(0);
    });

    it('should NOT emit when duplicate id is used', () => {
      model.createInstanceWithId(1, 'cartesian_point');

      const events: InstanceCreatedEvent[] = [];
      model.on('instance:created', (e) => events.push(e));

      model.createInstanceWithId(1, 'direction');

      expect(events).toHaveLength(0);
    });
  });

  describe('instance:deleted', () => {
    it('should emit event with correct id and entityName', () => {
      const { instance } = model.createInstance('cartesian_point');
      const events: InstanceDeletedEvent[] = [];
      model.on('instance:deleted', (e) => events.push(e));

      model.deleteInstance(instance!.id);

      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('instance:deleted');
      expect(events[0]!.instanceId).toBe(instance!.id);
      expect(events[0]!.entityName).toBe('CARTESIAN_POINT');
    });

    it('should NOT emit when instance does not exist', () => {
      const events: InstanceDeletedEvent[] = [];
      model.on('instance:deleted', (e) => events.push(e));

      model.deleteInstance(asInstanceId(999));

      expect(events).toHaveLength(0);
    });
  });

  describe('attribute:changed', () => {
    it('should emit event with correct fields on model.setAttribute', () => {
      const { instance } = model.createInstance('cartesian_point');
      const events: AttributeChangedEvent[] = [];
      model.on('attribute:changed', (e) => events.push(e));

      model.setAttribute(instance!, 'name', 'Origin');

      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('attribute:changed');
      expect(events[0]!.instanceId).toBe(instance!.id);
      expect(events[0]!.entityName).toBe('CARTESIAN_POINT');
      expect(events[0]!.attributeName).toBe('NAME');
      expect(events[0]!.oldValue).toBeUndefined();
      expect(events[0]!.newValue).toBe('Origin');
    });

    it('should emit with correct oldValue on second assignment', () => {
      const { instance } = model.createInstance('cartesian_point');
      model.setAttribute(instance!, 'name', 'First');

      const events: AttributeChangedEvent[] = [];
      model.on('attribute:changed', (e) => events.push(e));

      model.setAttribute(instance!, 'name', 'Second');

      expect(events).toHaveLength(1);
      expect(events[0]!.oldValue).toBe('First');
      expect(events[0]!.newValue).toBe('Second');
    });

    it('should NOT emit when setAttribute fails (unknown attribute)', () => {
      const { instance } = model.createInstance('cartesian_point');
      const events: AttributeChangedEvent[] = [];
      model.on('attribute:changed', (e) => events.push(e));

      model.setAttribute(instance!, 'nonexistent', 42);

      expect(events).toHaveLength(0);
    });

    it('should NOT emit when setAttribute fails (type mismatch with schema)', () => {
      const { instance } = model.createInstance('cartesian_point');
      const events: AttributeChangedEvent[] = [];
      model.on('attribute:changed', (e) => events.push(e));

      model.setAttribute(instance!, 'coordinates', 'not-a-list', model.schema);

      expect(events).toHaveLength(0);
    });

    it('should NOT emit when setAttribute fails (DERIVED attribute)', () => {
      const { instance } = model.createInstance('vector');
      const events: AttributeChangedEvent[] = [];
      model.on('attribute:changed', (e) => events.push(e));

      model.setAttribute(instance!, 'dim', 3);

      expect(events).toHaveLength(0);
    });

    it('should NOT emit when using standalone setAttribute', () => {
      const { instance } = model.createInstance('cartesian_point');
      const events: AttributeChangedEvent[] = [];
      model.on('attribute:changed', (e) => events.push(e));

      setAttribute(instance!, 'name', 'Standalone');

      expect(events).toHaveLength(0);
    });
  });

  describe('on / off lifecycle', () => {
    it('should remove listener with off()', () => {
      const events: InstanceCreatedEvent[] = [];
      const listener = (e: InstanceCreatedEvent) => events.push(e);

      model.on('instance:created', listener);
      model.createInstance('cartesian_point');
      expect(events).toHaveLength(1);

      model.off('instance:created', listener);
      model.createInstance('direction');
      expect(events).toHaveLength(1);
    });

    it('should deliver event to multiple listeners', () => {
      const events1: InstanceCreatedEvent[] = [];
      const events2: InstanceCreatedEvent[] = [];

      model.on('instance:created', (e) => events1.push(e));
      model.on('instance:created', (e) => events2.push(e));

      model.createInstance('cartesian_point');

      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(1);
    });

    it('should not deliver to removed listener while other listeners remain', () => {
      const events1: InstanceCreatedEvent[] = [];
      const events2: InstanceCreatedEvent[] = [];
      const listener1 = (e: InstanceCreatedEvent) => events1.push(e);
      const listener2 = (e: InstanceCreatedEvent) => events2.push(e);

      model.on('instance:created', listener1);
      model.on('instance:created', listener2);
      model.off('instance:created', listener1);

      model.createInstance('cartesian_point');

      expect(events1).toHaveLength(0);
      expect(events2).toHaveLength(1);
    });
  });
});
