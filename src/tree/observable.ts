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

export type Observable<T> = {
  next(value: T): void;
  getSnapshot(): T;
  subscribe(callback: (value: T) => void): () => void;
};
