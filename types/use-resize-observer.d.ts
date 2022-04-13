import * as React from "react";
export declare function useResizeObserver<
  T extends HTMLElement,
  R extends typeof ResizeObserver
>(
  target: React.RefObject<T> | T | null,
  callback: UseResizeObserverCallback,
  options?: {
    ResizeObserver: R;
  }
): void;
export declare type UseResizeObserverCallback = (
  entry: ResizeObserverEntry,
  observer: ResizeObserver
) => void;
