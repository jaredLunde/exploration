import type { Observable } from "./tree/observable";
/**
 * A hook for subscribing to changes to the value of an observable.
 *
 * @param observable - An observable
 * @param onChange - A callback that is invoked when the observable changes
 */
export declare function useObservable<T>(observable: Observable<T>, onChange: (value: T) => void | (() => void)): void;
