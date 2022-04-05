import type { Observable } from "./tree/observable";
import { observable } from "./tree/observable";

export class ObservableSet<T> extends Set<T> {
  didChange: Observable<IterableIterator<T>>;

  constructor(initialValue?: T[]) {
    super(initialValue);
    this.didChange = observable(this.values());
  }

  add(value: T) {
    super.add(value);
    this.didChange.next(this.values());
    return this;
  }

  delete(value: T) {
    const deleted = super.delete(value);
    this.didChange.next(this.values());
    return deleted;
  }

  clear() {
    super.clear();
    this.didChange.next(this.values());
    return this;
  }
}

export class ObservableMap<K, V> extends Map<K, V> {
  didChange: Observable<IterableIterator<[K, V]>>;

  constructor(initialValue?: [K, V][]) {
    super(initialValue);
    this.didChange = observable(this.entries());
  }

  set(key: K, value: V) {
    super.set(key, value);
    this.didChange.next(this.entries());
    return this;
  }

  delete(key: K) {
    const deleted = super.delete(key);
    this.didChange.next(this.entries());
    return deleted;
  }

  clear() {
    super.clear();
    this.didChange.next(this.entries());
    return this;
  }
}
