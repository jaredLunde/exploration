/**
 * Merges multiple props objects together. Event handlers are chained,
 * classNames are combined, and ids are deduplicated - different ids
 * will trigger a side-effect and re-render components hooked up with `useId`.
 * For all other props, the last prop object overrides all previous ones.
 *
 * @param args - Multiple sets of props to merge together.
 */
export declare function mergeProps<T extends Props[]>(
  args: T
): UnionToIntersection<TupleTypes<T>>;
/**
 * Calls all functions in the order they were chained with the same arguments.
 *
 * @param {...any} callbacks
 */
export declare function chain<Args extends any[]>(
  ...callbacks: Args
): (...args: Args) => void;
export declare function throttle<CallbackArguments extends any[]>(
  callback: (...args: CallbackArguments) => void,
  fps?: number,
  leading?: boolean
): (...args: CallbackArguments) => void;
export declare function shallowEqual<
  A extends Record<string | number | symbol, unknown> | null,
  B extends Record<string | number | symbol, unknown> | null
>(objA: A, objB: B | A): boolean;
interface Props {
  [key: string]: any;
}
declare type TupleTypes<T> = {
  [P in keyof T]: T[P];
} extends {
  [key: number]: infer V;
}
  ? V
  : never;
declare type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;
export {};
