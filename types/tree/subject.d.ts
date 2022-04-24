/**
 * A utility for emitting abd subscribing to changes to a value.
 *
 * @param  initialState - The initial value of the subject.
 */
export declare function subject<T>(initialState: T): Subject<T>;
export declare function pureSubject<T>(initialValue: T, areEqual?: (current: T, next: T) => boolean): Subject<T>;
export declare type Subject<T> = {
    /**
     * Emit a new state.
     *
     * @param state - The new state
     */
    setState(state: T): void;
    /**
     * Get the current state.
     */
    getState(): T;
    /**
     * Observe changes to the state.
     *
     * @param observer - A callback that is invoked when the value changes
     */
    observe(observer: Observer<T>): () => void;
    /**
     * Remove a observer from the list of observers
     *
     * @param observer - A callback that is invoked when the value changes
     */
    unobserve(observer: Observer<T>): void;
};
export declare type Observer<T> = {
    (state: T): void;
};
