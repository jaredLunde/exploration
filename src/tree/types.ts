import type { Branch } from "./branch";
import type { Leaf } from "./leaf";

export type TreeNode<NodeData = {}> = Leaf<NodeData> | Branch<NodeData>;

export type TreeNodeFactory<NodeData = {}> = {
  createBranch: (data: NodeData, expanded?: boolean) => Branch<NodeData>;
  createLeaf: (data: NodeData) => Leaf<NodeData>;
};

export type TreeSource<NodeData = {}> = {
  getNodes: (
    parent: Branch<NodeData>,
    factory: TreeNodeFactory<NodeData>
  ) => TreeNode<NodeData>[] | Promise<TreeNode<NodeData>[]>;
};

export type TreeNodeComparator<NodeData = {}> = (
  a: TreeNode<NodeData>,
  b: TreeNode<NodeData>
) => number;
