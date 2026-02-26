import type { EntityInstance } from '../types/instance';
import type { AttributeValue, InstanceId } from '../types/values';

// ── Instance lifecycle events ────────────────────────────

export interface InstanceCreatedEvent {
  readonly type: 'instance:created';
  readonly instanceId: InstanceId;
  readonly entityName: string;
  readonly instance: EntityInstance;
}

export interface InstanceDeletedEvent {
  readonly type: 'instance:deleted';
  readonly instanceId: InstanceId;
  readonly entityName: string;
}

export interface AttributeChangedEvent {
  readonly type: 'attribute:changed';
  readonly instanceId: InstanceId;
  readonly entityName: string;
  readonly attributeName: string;
  readonly oldValue: AttributeValue | undefined;
  readonly newValue: AttributeValue;
}

// ── Transaction lifecycle events ─────────────────────────

export interface TransactionBeginEvent {
  readonly type: 'transaction:begin';
}

export interface TransactionCommitEvent {
  readonly type: 'transaction:commit';
  readonly eventCount: number;
}

export interface TransactionRollbackEvent {
  readonly type: 'transaction:rollback';
  readonly discardedEventCount: number;
}

// ── Union types ──────────────────────────────────────────

export type InstanceEvent =
  | InstanceCreatedEvent
  | InstanceDeletedEvent
  | AttributeChangedEvent;

export type TransactionEvent =
  | TransactionBeginEvent
  | TransactionCommitEvent
  | TransactionRollbackEvent;

export type StepModelEvent = InstanceEvent | TransactionEvent;

export type StepModelEventMap = {
  'instance:created': InstanceCreatedEvent;
  'instance:deleted': InstanceDeletedEvent;
  'attribute:changed': AttributeChangedEvent;
  'transaction:begin': TransactionBeginEvent;
  'transaction:commit': TransactionCommitEvent;
  'transaction:rollback': TransactionRollbackEvent;
};

export type StepModelEventType = keyof StepModelEventMap;

export type StepModelListener<T extends StepModelEventType> = (
  event: StepModelEventMap[T],
) => void;
