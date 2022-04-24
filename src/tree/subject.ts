/**
 * A utility for emitting abd subscribing to changes to a value.
 *
 * @param  initialState - The initial value of the subject.
 */
export function subject<T>(initialState: T): Subject<T> {
  const observers: Set<Observer<T>> = new Set();
  let state = initialState;

  return {
    setState(nextState: T) {
      state = nextState;

      for (const listener of observers) {
        listener(nextState);
      }
    },

    getState() {
      return state;
    },

    observe(observer: Observer<T>) {
      observers.add(observer);

      return () => {
        observers.delete(observer);
      };
    },

    unobserve(observer: Observer<T>) {
      observers.delete(observer);
    },
  };
}

export function pureSubject<T>(
  initialValue: T,
  areEqual: (current: T, next: T) => boolean = (current, next) =>
    current === next
): Subject<T> {
  const observers: Set<Observer<T>> = new Set();
  let state = initialValue;

  return {
    setState(nextState: T) {
      if (areEqual(state, nextState)) return;
      state = nextState;

      for (const listener of observers) {
        listener(nextState);
      }
    },

    getState() {
      return state;
    },

    observe(observer: Observer<T>) {
      observers.add(observer);

      return () => {
        observers.delete(observer);
      };
    },

    unobserve(observer: Observer<T>) {
      observers.delete(observer);
    },
  };
}

export type Subject<T> = {
  /**
   * Emit a new state.
   *
   * @param state - The new state
   */
  setState(state: T): void;
  /**
   * Get the current state.
   */
  getState(): T;
  /**
   * Observe changes to the state.
   *
   * @param observer - A callback that is invoked when the value changes
   */
  observe(observer: Observer<T>): () => void;
  /**
   * Remove a observer from the list of observers
   *
   * @param observer - A callback that is invoked when the value changes
   */
  unobserve(observer: Observer<T>): void;
};

export type Observer<T> = {
  (state: T): void;
};
