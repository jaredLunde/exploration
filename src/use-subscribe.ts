import * as React from "react";
import type { Observable } from "./tree/observable";

export function useSubscribe<T>(
  toObservable: Observable<T>,
  onChange: (value: T) => void | (() => void)
) {
  const storedOnChange = React.useRef(onChange);

  React.useEffect(() => {
    storedOnChange.current = onChange;
  });

  React.useEffect(() => {
    let didUnmount = false;
    let cleanup: void | (() => void);

    const unsubscribe = toObservable.subscribe(() => {
      if (didUnmount) return;
      cleanup?.();
      cleanup = storedOnChange.current(toObservable.getSnapshot());
    });

    return () => {
      didUnmount = true;
      cleanup?.();
      unsubscribe();
    };
  }, [toObservable]);
}
