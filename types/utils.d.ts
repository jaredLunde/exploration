/**
 * Merges multiple props objects together. Event handlers are chained,
 * classNames are combined, and styles are combined.
 *
 * For all other props, the last prop object overrides all previous ones.
 *
 * @param args - Multiple sets of props to merge together.
 */
export declare function mergeProps<T extends Props[]>(args: T): UnionToIntersection<TupleTypes<T>>;
/**
 * Calls all functions in the order they were chained with the same arguments.
 *
 * @param  callbacks - Callbacks to chain together
 */
export declare function chain<Args extends any[]>(...callbacks: Args): (...args: Args) => void;
export declare function throttle<CallbackArguments extends any[]>(callback: (...args: CallbackArguments) => void, fps?: number, leading?: boolean): (...args: CallbackArguments) => void;
export declare function shallowEqual<A extends Record<string | number | symbol, unknown> | null, B extends Record<string | number | symbol, unknown> | null>(objA: A, objB: B | A): boolean;
/**
 * Retry a promise until it resolves or the max number of retries is reached.
 *
 * @param promiseFn - A function that returns a promise to retry
 * @param config - Options
 * @param config.maxRetries - Max number of retries
 * @param config.initialDelay - Initial delay before first retry
 * @param config.delayMultiple - Multiplier for each subsequent retry
 * @param config.shouldRetry - A function that should return `false` to stop retrying
 */
export declare function retryWithBackoff<T>(promiseFn: () => Promise<T>, config?: RetryWithBackoffConfig): Promise<T>;
export interface RetryWithBackoffConfig {
    /**
     * Max number of retries
     *
     * @default 4
     */
    maxRetries?: number;
    /**
     * Initial delay before first retry
     *
     * @default 100
     */
    initialDelay?: number;
    /**
     * Multiplier for each subsequent retry
     *
     * @default 2
     */
    delayMultiple?: number;
    /**
     * A function that should return `false` to stop retrying
     *
     * @param error - The error that caused the retry
     */
    shouldRetry?: (error: unknown) => boolean;
}
interface Props {
    [key: string]: any;
}
declare type TupleTypes<T> = {
    [P in keyof T]: T[P];
} extends {
    [key: number]: infer V;
} ? V : never;
declare type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export {};
