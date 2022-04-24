import type { Node } from "./branch";
import { Branch } from "./branch";
import { Leaf } from "./leaf";
export declare class Tree<NodeData = {}> {
  protected loadingBranches: Map<Branch<NodeData>, Promise<void>>;
  private getNodes;
  comparator?: (a: Node<NodeData>, b: Node<NodeData>) => number;
  flatView: import("./subject").Subject<number>;
  root: Branch<NodeData>;
  nodesById: Node<NodeData>[];
  constructor({
    getNodes,
    root,
    comparator,
  }: {
    getNodes: GetNodes<NodeData>;
    root: Branch<NodeData>;
    comparator?: (a: Node<NodeData>, b: Node<NodeData>) => number;
  });
  get visibleNodes(): number[];
  getById(id: number): Node<NodeData> | undefined;
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
  expand(
    branch: Branch<NodeData>,
    options?: {
      ensureVisible?: boolean;
      recursive?: boolean;
    }
  ): Promise<void>;
  collapse(branch: Branch<NodeData>): void;
  protected _produce(
    branch: Branch<NodeData>,
    produceFn: (context: {
      get draft(): Node<NodeData>[];
      insert<NodeType extends Node<NodeData>>(
        node: NodeType,
        insertionIndex?: number
      ): NodeType;
      revert(): void;
    }) => void | Node<NodeData>[]
  ): void;
  remove(nodeToRemove: Node<NodeData>): void;
  move(node: Node<NodeData>, to: Branch<NodeData>): Promise<void>;
  invalidateFlatView(): void;
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
  /**
   * Returns `true` if the node and its parents are visible in the tree.
   *
   * @param node - The node to check
   */
  isVisible(node: Node<NodeData>): boolean;
  /**
   * You can use this method to manually trigger a reload of a branch in the tree.
   *
   * @param branch - The branch to load nodes for
   */
  loadNodes(branch: Branch<NodeData>): Promise<void>;
  protected setNodes(
    branch: Branch<NodeData>,
    nodeIds: number[] | Node<NodeData>[]
  ): void;
  private createVisibleNodes;
  dispose(): void;
}
export declare function isLeaf<T>(node: Node<T> | undefined): node is Leaf<T>;
export declare function isBranch<T>(
  node: Node<T> | undefined
): node is Branch<T>;
export declare type GetNodes<NodeData = {}> = {
  (parent: Branch<NodeData>): Node<NodeData>[] | Promise<Node<NodeData>[]>;
};
