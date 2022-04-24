import type { Subject } from "./tree/subject";
import { subject } from "./tree/subject";

export class SubjectSet<T> extends Set<T> {
  didChange: Subject<Set<T>>;

  constructor(initialValue?: T[]) {
    super(initialValue);
    this.didChange = subject(new Set(this));
  }

  add(value: T) {
    super.add(value);
    this.didChange.setState(new Set(this));
    return this;
  }

  delete(value: T) {
    const deleted = super.delete(value);
    this.didChange.setState(new Set(this));
    return deleted;
  }

  clear() {
    super.clear();
    this.didChange.setState(new Set(this));
    return this;
  }
}

export class SubjectMap<K, V> extends Map<K, V> {
  didChange: Subject<Map<K, V>>;

  constructor(initialValue?: [K, V][]) {
    super(initialValue);
    this.didChange = subject(new Map(this));
  }

  set(key: K, value: V) {
    super.set(key, value);
    this.didChange.setState(new Map(this));
    return this;
  }

  delete(key: K) {
    const deleted = super.delete(key);
    this.didChange.setState(new Map(this));
    return deleted;
  }

  clear() {
    super.clear();
    this.didChange.setState(new Map(this));
    return this;
  }
}
