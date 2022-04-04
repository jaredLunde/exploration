import { observable } from "./observable";
export class FlatViewMap extends Map<K, V> {
  private didSetInitial = false;
  didChange = observable(0);

  set(key: K, value: V): this {
    const prev = super.get(key);
    super.set(key, value);

    if (prev !== value && this.didSetInitial) {
      this.didChange.next(key);
    }

    this.didSetInitial = true;
    return this;
  }
}

type K = number;
type V = Uint32Array;
