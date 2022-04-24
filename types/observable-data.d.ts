import type { Subject } from "./tree/subject";
export declare class SubjectSet<T> extends Set<T> {
  didChange: Subject<Set<T>>;
  constructor(initialValue?: T[]);
  add(value: T): this;
  delete(value: T): boolean;
  clear(): this;
}
export declare class SubjectMap<K, V> extends Map<K, V> {
  didChange: Subject<Map<K, V>>;
  constructor(initialValue?: [K, V][]);
  set(key: K, value: V): this;
  delete(key: K): boolean;
  clear(): this;
}
