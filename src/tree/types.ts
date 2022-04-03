import type { Branch } from "./branch";
import type { Leaf } from "./leaf";

export type Node<NodeData = {}> = Leaf<NodeData> | Branch<NodeData>;

export type NodeFactory<NodeData = {}> = {
  createBranch: (data: NodeData, expanded?: boolean) => Branch<NodeData>;
  createLeaf: (data: NodeData) => Leaf<NodeData>;
};

export type Source<NodeData = {}> = {
  getNodes: (
    parent: Branch<NodeData>,
    factory: NodeFactory<NodeData>
  ) => Node<NodeData>[] | Promise<Node<NodeData>[]>;
};

export type NodeComparator<NodeData = {}> = (
  a: Node<NodeData>,
  b: Node<NodeData>
) => number;
