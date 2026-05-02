import { beforeEach, describe, expect, it } from 'vitest';
import { setAttribute, StepModel } from '../../src';
import type {
  TransactionBeginEvent,
  TransactionCommitEvent,
  TransactionRollbackEvent,
} from '../../src/events/model-events';
import { buildTestSchema } from '../fixtures/build-test-schema';

describe('Transactions', () => {
  let model: StepModel;

  beforeEach(() => {
    const schema = buildTestSchema();
    model = new StepModel(schema);
  });

  describe('beginTransaction + commit', () => {
    it('should persist instances created during transaction after commit', () => {
      model.beginTransaction();
      const { instance } = model.createInstance('cartesian_point');
      expect(instance).toBeDefined();
      expect(model.size).toBe(1);

      model.commit();

      expect(model.size).toBe(1);
      expect(model.getInstance(instance!.id)).toBe(instance);
    });

    it('should persist attribute changes after commit', () => {
      const { instance } = model.createInstance('cartesian_point');

      model.beginTransaction();
      model.setAttribute(instance!, 'name', 'Committed');
      model.commit();

      expect(instance!.attributes.get('NAME')).toBe('Committed');
    });

    it('should persist deletions after commit', () => {
      const { instance } = model.createInstance('cartesian_point');
      const id = instance!.id;

      model.beginTransaction();
      model.deleteInstance(id);
      model.commit();

      expect(model.size).toBe(0);
      expect(model.getInstance(id)).toBeUndefined();
    });
  });

  describe('beginTransaction + rollback', () => {
    it('should remove instances created during transaction after rollback', () => {
      model.beginTransaction();
      model.createInstance('cartesian_point');
      model.createInstance('direction');
      expect(model.size).toBe(2);

      model.rollback();

      expect(model.size).toBe(0);
    });

    it('should restore _nextId after rollback', () => {
      model.beginTransaction();
      model.createInstance('cartesian_point');
      model.rollback();

      const { instance } = model.createInstance('cartesian_point');
      expect(instance!.id).toBe(1);
    });

    it('should restore deleted instances after rollback', () => {
      const { instance } = model.createInstance('cartesian_point');
      const id = instance!.id;

      model.beginTransaction();
      model.deleteInstance(id);
      expect(model.size).toBe(0);

      model.rollback();

      expect(model.size).toBe(1);
      expect(model.getInstance(id)).toBeDefined();
      expect(model.getInstance(id)!.typeName).toBe('CARTESIAN_POINT');
    });

    it('should restore attribute values modified during transaction', () => {
      const { instance } = model.createInstance('cartesian_point');
      setAttribute(instance!, 'name', 'Original');

      model.beginTransaction();
      model.setAttribute(instance!, 'name', 'Modified');
      expect(instance!.attributes.get('NAME')).toBe('Modified');

      model.rollback();

      expect(instance!.attributes.get('NAME')).toBe('Original');
    });

    it('should restore _byType index after rollback', () => {
      model.createInstance('cartesian_point');

      model.beginTransaction();
      model.createInstance('cartesian_point');
      model.createInstance('direction');
      expect(model.getInstancesOf('CARTESIAN_POINT')).toHaveLength(2);
      expect(model.getInstancesOf('POINT')).toHaveLength(2);
      expect(model.getInstancesOf('DIRECTION')).toHaveLength(1);

      model.rollback();

      expect(model.getInstancesOf('CARTESIAN_POINT')).toHaveLength(1);
      expect(model.getInstancesOf('POINT')).toHaveLength(1);
      expect(model.getInstancesOf('DIRECTION')).toHaveLength(0);
    });

    it('should clear _derivedCache on restored instances', () => {
      const { instance } = model.createInstance('cartesian_point');
      instance!._derivedCache.set('TEST', 123);

      model.beginTransaction();
      model.rollback();

      expect(instance!._derivedCache.size).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should throw when calling commit without active transaction', () => {
      expect(() => model.commit()).toThrow('No active transaction to commit');
    });

    it('should throw when calling rollback without active transaction', () => {
      expect(() => model.rollback()).toThrow(
        'No active transaction to rollback',
      );
    });

    it('should throw when calling beginTransaction with active transaction', () => {
      model.beginTransaction();
      expect(() => model.beginTransaction()).toThrow(
        'Nested transactions are not supported',
      );
      model.rollback();
    });
  });

  describe('hasActiveTransaction', () => {
    it('should be false initially', () => {
      expect(model.hasActiveTransaction).toBe(false);
    });

    it('should be true after beginTransaction', () => {
      model.beginTransaction();
      expect(model.hasActiveTransaction).toBe(true);
      model.rollback();
    });

    it('should be false after commit', () => {
      model.beginTransaction();
      model.commit();
      expect(model.hasActiveTransaction).toBe(false);
    });

    it('should be false after rollback', () => {
      model.beginTransaction();
      model.rollback();
      expect(model.hasActiveTransaction).toBe(false);
    });
  });

  describe('transaction events', () => {
    it('should emit transaction:begin immediately when calling beginTransaction', () => {
      const events: TransactionBeginEvent[] = [];
      model.on('transaction:begin', (e) => events.push(e));

      model.beginTransaction();

      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('transaction:begin');
      model.rollback();
    });

    it('should emit transaction:commit with correct eventCount', () => {
      const events: TransactionCommitEvent[] = [];
      model.on('transaction:commit', (e) => events.push(e));

      model.beginTransaction();
      model.createInstance('cartesian_point');
      model.createInstance('direction');
      model.commit();

      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('transaction:commit');
      expect(events[0]!.eventCount).toBe(2);
    });

    it('should emit transaction:rollback with correct discardedEventCount', () => {
      const events: TransactionRollbackEvent[] = [];
      model.on('transaction:rollback', (e) => events.push(e));

      model.beginTransaction();
      model.createInstance('cartesian_point');
      model.createInstance('direction');
      model.createInstance('colour_rgb');
      model.rollback();

      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('transaction:rollback');
      expect(events[0]!.discardedEventCount).toBe(3);
    });

    it('should emit transaction events even during an active transaction (never buffered)', () => {
      const beginEvents: TransactionBeginEvent[] = [];
      model.on('transaction:begin', (e) => beginEvents.push(e));

      model.beginTransaction();

      expect(beginEvents).toHaveLength(1);
      model.rollback();
    });
  });
});
