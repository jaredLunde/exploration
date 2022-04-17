import type { Branch } from "./branch";
import { nodesById } from "./nodes-by-id";

export class Leaf<NodeData = {}> {
  /**
   * The unique ID of the node
   */
  public readonly id = nextId();
  /**
   * The ID of the parent node
   */
  public parentId = -1;

  constructor(
    /**
     * The parent node
     */
    parent: Branch<NodeData> | null,
    /**
     * The data for this node
     */
    public data: NodeData
  ) {
    this.parentId = parent === null ? -1 : parent.id;
  }

  /**
   * The parent node
   */
  get parent(): Branch<NodeData> | null {
    return this.parentId === -1
      ? null
      : (nodesById[this.parentId] as Branch<NodeData>);
  }

  /**
   * The depth of the node in the tree
   */
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
