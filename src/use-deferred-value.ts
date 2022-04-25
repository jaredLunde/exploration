import {
  clearRequestTimeout,
  requestTimeout,
} from "@essentials/request-timeout";
import * as React from "react";

export const useDeferredValue: <T>(
  value: T,
  options?: {
    timeoutMs: number;
  }
) => T =
  typeof React.useDeferredValue === "function"
    ? (React.useDeferredValue as any)
    : useThrottle;

export function useThrottle<T>(
  value: T,
  options: { timeoutMs: number } = { timeoutMs: 200 }
) {
  const [state, setState] = React.useState<T>(value);
  const lastInvocation = React.useRef<number>(0);
  const waitedFor = React.useRef<number>(0);

  React.useEffect(() => {
    let didUnmount = false;
    const now = performance.now();
    waitedFor.current +=
      now - (lastInvocation.current === 0 ? now : lastInvocation.current);
    lastInvocation.current = now;

    const timeout = requestTimeout(() => {
      if (!didUnmount) {
        setState(value);
        waitedFor.current = 0;
        lastInvocation.current = 0;
      }
    }, Math.max(options.timeoutMs - waitedFor.current, 0));

    return () => {
      didUnmount = true;
      clearRequestTimeout(timeout);
    };
  }, [value, options.timeoutMs]);

  return state;
}
