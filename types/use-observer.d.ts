import type { Observer, Subject } from "./tree/subject";
/**
 * A hook for observing changes to the value of a subject.
 *
 * @param subject - A subject to observe
 * @param observer - A callback that is invoked when the subject changes
 */
export declare function useObserver<T>(subject: Subject<T>, observer: Observer<T>): void;
