export declare const useDeferredValue: <T>(value: T, options?: {
    timeoutMs: number;
}) => T;
export declare function useThrottle<T>(value: T, options?: {
    timeoutMs: number;
}): T;
