/**
 * A utility for emitting abd subscribing to changes to a value.
 *
 * @param  initialValue - The initial value of the observable.
 */
export function observable<T>(initialValue: T): Observable<T> {
  const listeners: Set<(value: T) => void> = new Set();
  let snapshot = initialValue;

  return {
    next(value: T) {
      snapshot = value;

      for (const listener of listeners) {
        listener(value);
      }
    },

    getSnapshot() {
      return snapshot;
    },

    subscribe(callback: (value: T) => void) {
      listeners.add(callback);

      return () => {
        listeners.delete(callback);
      };
    },
  };
}

export function pureObservable<T>(
  initialValue: T,
  areEqual: (current: T, next: T) => boolean = (current, next) =>
    current === next
): Observable<T> {
  const listeners: Set<(value: T) => void> = new Set();
  let snapshot = initialValue;

  return {
    next(value: T) {
      if (areEqual(snapshot, value)) return;
      snapshot = value;

      for (const listener of listeners) {
        listener(value);
      }
    },

    getSnapshot() {
      return snapshot;
    },

    subscribe(callback: (value: T) => void) {
      listeners.add(callback);

      return () => {
        listeners.delete(callback);
      };
    },
  };
}

export type Observable<T> = {
  /**
   * Emit a new value.
   *
   * @param value - The new value
   */
  next(value: T): void;
  /**
   * Get the current value.
   */
  getSnapshot(): T;
  /**
   * Subscribe to changes to the value.
   *
   * @param callback - A callback that is invoked when the value changes
   */
  subscribe(callback: (value: T) => void): () => void;
};
