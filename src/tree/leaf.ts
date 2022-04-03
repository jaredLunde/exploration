import type { Branch } from "./branch";

export class Leaf<NodeData = {}> {
  public readonly id = nextId();
  constructor(public parent: Branch<NodeData> | null, public data: NodeData) {}

  get depth(): number {
    if (!this.parent) {
      return 0;
    }

    return this.parent.depth + 1;
  }
}

const nextId = (() => {
  let id = 0;
  return () => id++;
})();
