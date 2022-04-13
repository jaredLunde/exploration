import type { Observable } from "./tree/observable";
import { observable } from "./tree/observable";

export class ObservableSet<T> extends Set<T> {
  didChange: Observable<Set<T>>;

  constructor(initialValue?: T[]) {
    super(initialValue);
    this.didChange = observable(new Set(this));
  }

  add(value: T) {
    super.add(value);
    this.didChange.next(new Set(this));
    return this;
  }

  delete(value: T) {
    const deleted = super.delete(value);
    this.didChange.next(new Set(this));
    return deleted;
  }

  clear() {
    super.clear();
    this.didChange.next(new Set(this));
    return this;
  }
}

export class ObservableMap<K, V> extends Map<K, V> {
  didChange: Observable<Map<K, V>>;

  constructor(initialValue?: [K, V][]) {
    super(initialValue);
    this.didChange = observable(new Map(this));
  }

  set(key: K, value: V) {
    super.set(key, value);
    this.didChange.next(new Map(this));
    return this;
  }

  delete(key: K) {
    const deleted = super.delete(key);
    this.didChange.next(new Map(this));
    return deleted;
  }

  clear() {
    super.clear();
    this.didChange.next(new Map(this));
    return this;
  }
}
