// @react-aria/utils
// Credit: https://github.com/adobe/react-spectrum/tree/main/packages/%40react-aria
import {
  clearRequestTimeout,
  requestTimeout,
} from "@essentials/request-timeout";
import clsx from "clsx";

/**
 * Merges multiple props objects together. Event handlers are chained,
 * classNames are combined, and styles are combined.
 *
 * For all other props, the last prop object overrides all previous ones.
 *
 * @param args - Multiple sets of props to merge together.
 */
export function mergeProps<T extends Props[]>(
  args: T
): UnionToIntersection<TupleTypes<T>> {
  // Start with a base clone of the first argument. This is a lot faster than starting
  // with an empty object and adding properties as we go.
  const result: Props = { ...args[0], style: { ...args[0]?.style } };

  for (let i = 1; i < args.length; i++) {
    const props = args[i];

    for (const key in props) {
      const a = result[key];
      const b = props[key];

      // Chain events
      if (
        typeof a === "function" &&
        typeof b === "function" &&
        // This is a lot faster than a regex.
        key[0] === "o" &&
        key[1] === "n" &&
        key.charCodeAt(2) >= /* 'A' */ 65 &&
        key.charCodeAt(2) <= /* 'Z' */ 90
      ) {
        result[key] = chain(a, b);
        // Merge classnames, sometimes classNames are empty string which eval to false,
        // so we just need to do a type check
      } else if (
        (key === "className" || key === "UNSAFE_className") &&
        typeof a === "string" &&
        typeof b === "string"
      ) {
        result[key] = clsx(a, b);
      } else if (
        key === "style" &&
        typeof a === "object" &&
        typeof b === "object"
      ) {
        result[key] = Object.assign(a, b);
      } else {
        result[key] = b;
      }
    }
  }

  return result as UnionToIntersection<TupleTypes<T>>;
}

/**
 * Calls all functions in the order they were chained with the same arguments.
 *
 * @param  callbacks - Callbacks to chain together
 */
export function chain<Args extends any[]>(
  ...callbacks: Args
): (...args: Args) => void {
  return (...args: any[]) => {
    for (let i = 0; i < callbacks.length; i++) {
      const callback = callbacks[i];

      if (typeof callback === "function") {
        callback(...args);
      }
    }
  };
}

export function throttle<CallbackArguments extends any[]>(
  callback: (...args: CallbackArguments) => void,
  fps = 30,
  leading = false
): (...args: CallbackArguments) => void {
  const ms = 1000 / fps;
  let prev = 0;
  let trailingTimeout: ReturnType<typeof requestTimeout>;
  const clearTrailing = () =>
    trailingTimeout && clearRequestTimeout(trailingTimeout);

  return function () {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;
    const rightNow = performance.now();
    const call = () => {
      prev = rightNow;
      clearTrailing();
      // @ts-expect-error: IArguments isn't assignable, but they're the same thing
      // eslint-disable-next-line prefer-spread
      callback.apply(null, args);
    };
    const current = prev;
    // leading
    if (leading && current === 0) return call();
    const delta = rightNow - current;
    // body
    if (rightNow - current > ms) {
      if (current > 0) return call();
      prev = rightNow;
    }
    // trailing
    clearTrailing();
    trailingTimeout = requestTimeout(() => {
      call();
      prev = 0;
    }, ms - delta);
  };
}

export function shallowEqual<
  A extends Record<string | number | symbol, unknown> | null,
  B extends Record<string | number | symbol, unknown> | null
>(objA: A, objB: B | A): boolean {
  if (objA === objB) return true;
  if (objA === null || objB === null) return false;
  for (const key in objA) if (objA[key] !== objB[key]) return false;
  return true;
}

interface Props {
  [key: string]: any;
}

// Taken from:
// https://stackoverflow.com/questions/51603250/typescript-3-parameter-list-intersection-type/51604379#51604379
type TupleTypes<T> = { [P in keyof T]: T[P] } extends { [key: number]: infer V }
  ? V
  : never;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;
