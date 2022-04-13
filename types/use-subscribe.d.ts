import type { Observable } from "./tree/observable";
export declare function useSubscribe<T>(
  toObservable: Observable<T>,
  onChange: (value: T) => void | (() => void)
): void;
