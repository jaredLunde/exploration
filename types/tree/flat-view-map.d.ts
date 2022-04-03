declare type K = number;
declare type V = Uint32Array;
export declare class FlatViewMap extends Map<K, V> {
    onDidSetKey?: (key: K, value: V) => void;
    set(key: K, value: V): this;
}
export {};
