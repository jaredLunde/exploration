import { observable } from "./observable";

export class FlatViewMap extends Map<K, V> {
  didChange = observable(0);

  set(key: K, value: V): this {
    const prev = super.get(key);

    if (prev !== value) {
      const size = this.size;
      super.set(key, value);

      if (size) {
        this.didChange.next(key);
      }
    }

    return this;
  }
}

type K = number;
type V = Uint32Array;
