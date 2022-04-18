/**
 * A utility for emitting abd subscribing to changes to a value.
 *
 * @param  initialValue - The initial value of the observable.
 */
export declare function observable<T>(initialValue: T): Observable<T>;
export declare function pureObservable<T>(initialValue: T, areEqual?: (current: T, next: T) => boolean): Observable<T>;
export declare type Observable<T> = {
    /**
     * Emit a new value.
     *
     * @param value - The new value
     */
    next(value: T): void;
    /**
     * Get the current value.
     */
    getSnapshot(): T;
    /**
     * Subscribe to changes to the value.
     *
     * @param callback - A callback that is invoked when the value changes
     */
    subscribe(callback: (value: T) => void): () => void;
};
