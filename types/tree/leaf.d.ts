import type { Branch } from "./branch";
export declare class Leaf<NodeData = {}> {
    /**
     * The data for this node
     */
    data: NodeData;
    /**
     * The unique ID of the node
     */
    readonly id: number;
    /**
     * The ID of the parent node
     */
    parentId: number;
    constructor(
    /**
     * The parent node
     */
    parent: Branch<NodeData> | null, 
    /**
     * The data for this node
     */
    data: NodeData);
    /**
     * The parent node
     */
    get parent(): Branch<NodeData> | null;
    /**
     * The depth of the node in the tree
     */
    get depth(): number;
}
