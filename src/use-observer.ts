import * as React from "react";
import type { Observer, Subject } from "./tree/subject";

/**
 * A hook for observing changes to the value of a subject.
 *
 * @param subject - A subject to observe
 * @param observer - A callback that is invoked when the subject changes
 */
export function useObserver<T>(subject: Subject<T>, observer: Observer<T>) {
  const storedObserver = React.useRef(observer);

  React.useEffect(() => {
    storedObserver.current = observer;
  });

  React.useEffect(() => {
    let didUnmount = false;
    let cleanup: void | (() => void);

    const unobserve = subject.observe((value) => {
      if (didUnmount) return;
      cleanup?.();
      cleanup = storedObserver.current(value);
    });

    return () => {
      didUnmount = true;
      cleanup?.();
      unobserve();
    };
  }, [subject]);
}
