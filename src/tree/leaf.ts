import type { Branch } from "./branch";

export class Leaf<NodeData = {}> {
  constructor(
    public readonly id: number,
    public parent: Branch<NodeData> | null,
    public data: NodeData
  ) {}

  get depth(): number {
    if (!this.parent) {
      return 0;
    }

    return this.parent.depth + 1;
  }
}
