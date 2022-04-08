import * as React from "react";
import type { Observable } from "./tree/observable";

export function useSubscribe<T>(
  toObservable: Observable<T>,
  onChange: (value: T) => void
) {
  const storedOnChange = React.useRef(onChange);

  React.useEffect(() => {
    storedOnChange.current = onChange;
  });

  React.useEffect(() => {
    let didUnmount = false;

    const unsubscribe = toObservable.subscribe(() => {
      if (didUnmount) return;
      storedOnChange.current(toObservable.getSnapshot());
    });

    return () => {
      didUnmount = true;
      unsubscribe();
    };
  }, [toObservable]);
}
