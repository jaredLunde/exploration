import { Leaf } from "./leaf";
export declare class Branch<NodeData = {}> extends Leaf<NodeData> {
    /**
     * The child node IDs of this branch
     */
    nodes?: number[];
    /**
     * A flag indicating the "intended" expansion status of this branch. If this is `true`, the branch
     * is either already expanded OR is about to be expanded. Explained below.
     *
     * This value represents the "intended" expansion state not the "actual" expansion state. When
     * `Tree#expand` is called, the value of this will be immediately become `true`, however because
     * the child nodes of the branch in question might need to be loaded, the actual expansion won't
     * take effect until the children are loaded. So in that interim time while children are loading,
     * the branch isn't truly expanded even if the value is `true`.
     *
     * Depending on your use case you might want to rely on `Tree#isExpanded` for a "real-time" status.
     */
    expanded: boolean;
    constructor(
    /**
     * The parent node
     */
    parent: Branch<NodeData> | null, 
    /**
     * The data for this node
     */
    data: NodeData, 
    /**
     * Is the branch expanded?
     */
    expanded?: boolean);
    /**
     * Returns `true` if the node is a child of this branch, regardless of
     * depth.
     *
     * @param node - A tree node
     */
    contains(node: Node<NodeData>): boolean;
}
export declare type Node<NodeData = {}> = Leaf<NodeData> | Branch<NodeData>;
