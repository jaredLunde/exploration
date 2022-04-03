import type { Branch } from "./branch";

export class Leaf<T = {}> {
  constructor(
    public readonly id: number,
    public readonly parent: Branch<T> | null,
    public data: T
  ) {}

  get depth(): number {
    if (!this.parent) {
      return 0;
    }

    return this.parent.depth + 1;
  }
}
