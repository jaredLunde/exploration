import type { Observable } from "./tree/observable";
export declare class ObservableSet<T> extends Set<T> {
    didChange: Observable<Set<T>>;
    constructor(initialValue?: T[]);
    add(value: T): this;
    delete(value: T): boolean;
    clear(): this;
}
export declare class ObservableMap<K, V> extends Map<K, V> {
    didChange: Observable<Map<K, V>>;
    constructor(initialValue?: [K, V][]);
    set(key: K, value: V): this;
    delete(key: K): boolean;
    clear(): this;
}
