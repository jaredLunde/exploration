import type { Branch } from "./branch";
import type { Leaf } from "./leaf";
export declare type Node<NodeData = {}> = Leaf<NodeData> | Branch<NodeData>;
export declare type GetNodes<NodeData = {}> = {
    (parent: Branch<NodeData>): Node<NodeData>[] | Promise<Node<NodeData>[]>;
};
