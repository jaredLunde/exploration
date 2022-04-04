import * as React from "react";
import { useDebounce as useDebounceBase } from "use-debounce";

export const useDeferredValue: <T>(
  value: T,
  options?: {
    timeoutMs: number;
  }
) => T =
  typeof React.useDeferredValue === "function"
    ? (React.useDeferredValue as any)
    : useDebounce;

function useDebounce<T>(
  value: T,
  options: { timeoutMs: number } = { timeoutMs: 100 }
) {
  return useDebounceBase(value, options.timeoutMs)[0];
}
