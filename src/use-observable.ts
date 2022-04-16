import * as React from "react";
import type { Observable } from "./tree/observable";

/**
 * A hook for subscribing to changes to the value of an observable.
 *
 * @param observable - An observable
 * @param onChange - A callback that is invoked when the observable changes
 */
export function useObservable<T>(
  observable: Observable<T>,
  onChange: (value: T) => void | (() => void)
) {
  const storedOnChange = React.useRef(onChange);

  React.useEffect(() => {
    storedOnChange.current = onChange;
  });

  React.useEffect(() => {
    let didUnmount = false;
    let cleanup: void | (() => void);

    const unsubscribe = observable.subscribe(() => {
      if (didUnmount) return;
      cleanup?.();
      cleanup = storedOnChange.current(observable.getSnapshot());
    });

    return () => {
      didUnmount = true;
      cleanup?.();
      unsubscribe();
    };
  }, [observable]);
}
