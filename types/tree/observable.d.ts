export declare function observable<T>(initialValue: T): Observable<T>;
export declare function pureObservable<T>(
  initialValue: T,
  areEqual?: (current: T, next: T) => boolean
): Observable<T>;
export declare type Observable<T> = {
  next(value: T): void;
  getSnapshot(): T;
  subscribe(callback: (value: T) => void): () => void;
};
