type K = number;
type V = Uint32Array;

export class FlatViewMap extends Map<K, V> {
  public onDidSetKey?: (key: K, value: V) => void;

  set(key: K, value: V): this {
    const prev = super.get(key);
    super.set(key, value);

    if (prev !== value) {
      this.onDidSetKey?.(key, value);
    }

    return this;
  }
}
