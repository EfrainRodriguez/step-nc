import type {
  InstanceEvent,
  StepModelEventMap,
  StepModelEventType,
  StepModelListener,
  TransactionEvent,
} from './model-events';

type ListenerFn = (event: StepModelEventMap[StepModelEventType]) => void;

export class ModelEventEmitter {
  private _listeners = new Map<string, Set<ListenerFn>>();
  private _buffer: InstanceEvent[] | null = null;

  on<T extends StepModelEventType>(
    type: T,
    listener: StepModelListener<T>,
  ): void {
    let set = this._listeners.get(type);
    if (!set) {
      set = new Set<ListenerFn>();
      this._listeners.set(type, set);
    }
    set.add(listener as ListenerFn);
  }

  off<T extends StepModelEventType>(
    type: T,
    listener: StepModelListener<T>,
  ): void {
    const set = this._listeners.get(type);
    if (set) {
      set.delete(listener as ListenerFn);
      if (set.size === 0) {
        this._listeners.delete(type);
      }
    }
  }

  emit(event: InstanceEvent): void {
    if (this._buffer) {
      this._buffer.push(event);
      return;
    }
    this._dispatch(event.type, event);
  }

  emitImmediate(event: TransactionEvent): void {
    this._dispatch(event.type, event);
  }

  startBuffering(): void {
    this._buffer = [];
  }

  flushBuffer(): number {
    const buffer = this._buffer;
    this._buffer = null;
    if (!buffer) return 0;
    for (const event of buffer) {
      this._dispatch(event.type, event);
    }
    return buffer.length;
  }

  discardBuffer(): number {
    const buffer = this._buffer;
    this._buffer = null;
    return buffer ? buffer.length : 0;
  }

  private _dispatch(
    type: string,
    event: StepModelEventMap[StepModelEventType],
  ): void {
    const set = this._listeners.get(type);
    if (!set) return;
    for (const listener of set) {
      listener(event);
    }
  }
}
