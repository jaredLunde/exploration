import type { Branch } from "./branch";
export declare class Leaf<NodeData = {}> {
  data: NodeData;
  readonly id: number;
  parentId: number;
  constructor(parent: Branch<NodeData> | null, data: NodeData);
  get parent(): Branch<NodeData> | null;
  get depth(): number;
}
