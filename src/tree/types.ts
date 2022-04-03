import type { Branch } from "./branch";
import type { Leaf } from "./leaf";

export type Node<NodeData = {}> = Leaf<NodeData> | Branch<NodeData>;

export type GetNodes<NodeData = {}> = {
  (parent: Branch<NodeData>): Node<NodeData>[] | Promise<Node<NodeData>[]>;
};
