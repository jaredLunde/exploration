/**
 * Like Array.prototype.splice except this method won't throw
 * RangeError when given too many items (with spread operator as `...items`)
 *
 * Also items are concated straight up without having to use the spread operator
 *
 * Performance is more or less same as Array.prototype.splice
 *
 * @param arr - Array to splice
 * @param start - Start index where splicing should begin
 * @param deleteCount - Items to delete (optionally replace with given items)
 * @param elements - Items to insert (when deleteCount is same as items.length, it becomes a replace)
 */
export declare function spliceTypedArray(arr: Uint32Array, start: number, deleteCount?: number, elements?: Uint32Array): [Uint32Array, Uint32Array];
