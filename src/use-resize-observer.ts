import * as React from "react";

export function useResizeObserver<
  T extends HTMLElement,
  R extends typeof ResizeObserver
>(
  target: React.RefObject<T> | T | null,
  callback: UseResizeObserverCallback,
  options?: { ResizeObserver: R }
) {
  const resizeObserver = getResizeObserver(
    options?.ResizeObserver ??
      (typeof window !== "undefined" ? window.ResizeObserver : false)
  );
  const storedCallback = React.useRef(callback);

  React.useEffect(() => {
    storedCallback.current = callback;
  });

  React.useEffect(() => {
    let didUnobserve = false;
    const targetEl = target && "current" in target ? target.current : target;
    if (!targetEl) return () => {};

    function cb(entry: ResizeObserverEntry, observer: ResizeObserver) {
      if (didUnobserve) return;
      storedCallback.current(entry, observer);
    }

    resizeObserver?.observe(targetEl, cb);

    return () => {
      didUnobserve = true;
      resizeObserver?.unobserve(targetEl, cb);
    };
  }, [target, resizeObserver]);
}

function createResizeObserver<R extends typeof ResizeObserver>(
  ResizeObserver: R | false
) {
  if (!ResizeObserver) return;

  const callbacks: Map<Element, Array<UseResizeObserverCallback>> = new Map();
  const observer = new ResizeObserver((entries, obs) => {
    for (let i = 0; i < entries.length; i++) {
      const cbs = callbacks.get(entries[i].target);
      cbs?.forEach((cb) => cb(entries[i], obs));
    }
  });

  return {
    observer,
    observe(target: HTMLElement, callback: UseResizeObserverCallback) {
      observer.observe(target);
      const cbs = callbacks.get(target) ?? [];
      cbs.push(callback);
      callbacks.set(target, cbs);
    },
    unobserve(target: HTMLElement, callback: UseResizeObserverCallback) {
      const cbs = callbacks.get(target) ?? [];
      if (cbs.length === 1) {
        observer.unobserve(target);
        callbacks.delete(target);
        return;
      }
      const cbIndex = cbs.indexOf(callback);
      if (cbIndex !== -1) cbs.splice(cbIndex, 1);
      callbacks.set(target, cbs);
    },
  };
}

let _resizeObserver: ReturnType<typeof createResizeObserver>;

const getResizeObserver = <R extends typeof ResizeObserver>(
  resizeObserver: R | false
) =>
  !_resizeObserver
    ? (_resizeObserver = createResizeObserver(resizeObserver))
    : _resizeObserver;

export type UseResizeObserverCallback = (
  entry: ResizeObserverEntry,
  observer: ResizeObserver
) => void;
