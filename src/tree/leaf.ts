import type { Branch } from "./branch";
import { nodesById } from "./nodes-by-id";

export class Leaf<NodeData = {}> {
  public readonly id = nextId();
  public parentId = -1;

  constructor(parent: Branch<NodeData> | null, public data: NodeData) {
    this.parentId = parent === null ? -1 : parent.id;
  }

  get parent(): Branch<NodeData> | null {
    return this.parentId === -1
      ? null
      : (nodesById[this.parentId] as Branch<NodeData>);
  }

  get depth(): number {
    if (this.parentId === -1) {
      return 0;
    }

    return nodesById[this.parentId].depth + 1;
  }
}

const nextId = (() => {
  let id = 0;
  return () => id++;
})();
