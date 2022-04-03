import { Branch } from "./branch";
import { Leaf } from "./leaf";
import type { GetNodes, Node } from "./types";
export declare class Tree<NodeData = {}> {
    protected rootBranch: Branch<NodeData>;
    private flatViewMap;
    protected treeNodeMap: Map<number, Node<NodeData>>;
    private pendingLoadChildrenRequests;
    private onVisibleNodesChangeCallback;
    private getNodes;
    constructor({ getNodes, root, }: {
        getNodes: GetNodes<NodeData>;
        root: Branch<NodeData>;
    });
    onVisibleNodesChange(cb: () => void): void;
    get root(): Branch<NodeData>;
    get visibleNodes(): Uint32Array | undefined;
    getById: (id: number) => Node<NodeData> | undefined;
    /**
     * Ensures that the children of any given branch have been loaded and ready to be worked with.
     *
     * Call this method without any arguments to check if the root branch is loaded.
     *
     * ⚠ "Loaded" doesn't mean expanded, it just means the contents are "ready". Except when no arguments are given, the
     * branch being checked is root, and root is always expanded.
     *
     * @param branch - The branch to check
     */
    ensureLoaded(branch?: Branch<NodeData>): Promise<void>;
    expand(branch: Branch<NodeData>, options?: {
        ensureVisible?: boolean;
        recursive?: boolean;
    }): Promise<void>;
    collapse(branch: Branch<NodeData>): void;
    protected _produce(branch: Branch<NodeData>, produceFn: (context: {
        get draft(): Node<NodeData>[];
        insert<NodeType extends Node<NodeData>>(node: NodeType, insertionIndex?: number): NodeType;
        revert(): void;
    }) => void | Node<NodeData>[]): void;
    remove(nodeToRemove: Node<NodeData>): void;
    move(node: Node<NodeData>, to: Branch<NodeData>): Promise<void>;
    /**
     * A more accurate and real-time representation of whether a branch is expanded.
     *
     * `Branch#expanded` represents the "optimistic" expansion state of the branch in
     * question not the actual status, because the child nodes might still need to be
     * loaded before the change can be seen in the tree.
     *
     * @param branch - The branch to check
     */
    isExpanded(branch: Branch<NodeData>): boolean;
    isVisible(node: Node<NodeData>): boolean;
    private loadNodes;
    private setNodes;
    private removeNodeFromFlatView;
    private disconnectBranchFromClosestFlatView;
    private connectBranchToClosestFlatView;
    private isRootBranch;
    private findClosestDisconnectedParent;
    private getNodeProjectionRangeWithinFlatView;
}
export declare function isLeaf<T>(node: Node<T>): node is Leaf<T>;
export declare function isBranch<T>(node: Node<T>): node is Branch<T>;
