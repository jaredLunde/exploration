import memoizeOne from "@essentials/memoize-one";
import { retryWithBackoff } from "../utils";
import type { Node } from "./branch";
import { Branch } from "./branch";
import { Leaf } from "./leaf";
import { nodesById } from "./nodes-by-id";
import { subject } from "./subject";

export class Tree<NodeData = {}> {
  protected loadingBranches = new Map<Branch<NodeData>, Promise<void>>();
  private getNodes: GetNodes<NodeData>;
  comparator?: (a: Node<NodeData>, b: Node<NodeData>) => number;
  flatView = subject(0);
  root: Branch<NodeData>;
  nodesById = nodesById as Node<NodeData>[];

  constructor({
    getNodes,
    root,
    comparator,
  }: {
    getNodes: GetNodes<NodeData>;
    root: Branch<NodeData>;
    comparator?: (a: Node<NodeData>, b: Node<NodeData>) => number;
  }) {
    this.root = root;
    this.getNodes = getNodes;
    this.comparator = comparator;
    retryWithBackoff(() => this.expand(this.root), {
      shouldRetry: () => {
        return !this.isExpanded(this.root);
      },
    }).catch(() => {});
  }

  get visibleNodes(): number[] {
    return this.createVisibleNodes(this.flatView.getState());
  }

  getSnapshot = () => {
    return this.visibleNodes;
  };

  getById(id: number): Node<NodeData> | undefined {
    return this.nodesById[id];
  }

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
  async ensureLoaded(branch: Branch<NodeData> = this.root): Promise<void> {
    if (!branch.nodes) {
      await this.loadNodes(branch);
    }
  }

  async expand(
    branch: Branch<NodeData>,
    options: {
      ensureVisible?: boolean;
      recursive?: boolean;
    } = {}
  ): Promise<void> {
    const { ensureVisible = false, recursive = false } = options;
    const isVisibilitySkippable =
      !ensureVisible || (ensureVisible && this.isVisible(branch));

    if (!recursive && this.isExpanded(branch) && isVisibilitySkippable) {
      return;
    }

    branch.expanded = true;
    await this.ensureLoaded(branch);

    // Check again as collapse might have been called in the meantime
    if (branch.expanded) {
      if (ensureVisible) {
        while (branch.parent) {
          const node = branch.parent;

          if (isBranch(node)) {
            branch = node;
            branch.expanded = true;
          }
        }
      }

      if (recursive && branch.nodes) {
        await Promise.all(
          branch.nodes.map((nodeId) => {
            const node = this.nodesById[nodeId];
            return isBranch(node) ? this.expand(node, options) : null;
          })
        );
      }

      this.invalidate();
    }
  }

  collapse(branch: Branch<NodeData>): void {
    if (branch.expanded) {
      branch.expanded = false;
      this.invalidate();
    }
  }

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
  ): void {
    const nodes = (branch.nodes ?? []).map((nodeId) => this.nodesById[nodeId]);
    let draftResult = createDraft(nodes);

    draftResult.draft =
      produceFn({
        get draft() {
          return draftResult.draft;
        },
        insert(node, insertionIndex) {
          draftResult.modified = true;
          draftResult.draft.splice(insertionIndex ?? Infinity, 0, node);
          return node;
        },
        revert: () => {
          draftResult = createDraft(
            (branch.nodes ?? []).map((nodeId) => this.nodesById[nodeId])
          );
        },
      }) ?? draftResult.draft;

    if (draftResult.modified) {
      this.setNodes(branch, draftResult.draft);
      this.invalidate();
    }
  }

  remove(nodeToRemove: Node<NodeData>): void {
    if (isBranch(nodeToRemove) && nodeToRemove.nodes) {
      const nodes = [...nodeToRemove.nodes];
      let nodeId: number | undefined;

      while ((nodeId = nodes.pop())) {
        const node = this.nodesById[nodeId];

        if (isBranch(node) && node.nodes) {
          nodes.push(...node.nodes);
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        // @ts-expect-error
        nodesById[nodes[i]] = undefined;
      }
    }

    const nodeToRemoveParent = nodeToRemove.parent ?? this.root;

    // @ts-expect-error
    nodesById[nodeToRemove.id] = undefined;

    if (nodeToRemoveParent?.nodes) {
      let found = 0;
      const nextNodes: number[] = new Array(
        Math.max(nodeToRemoveParent.nodes.length - 1, 0)
      );

      for (let i = 0; i < nodeToRemoveParent.nodes.length; i++) {
        const nodeId = nodeToRemoveParent.nodes[i];

        if (nodeId !== nodeToRemove.id) {
          nextNodes[i - found] = nodeId;
        } else {
          found = 1;
        }
      }

      this.setNodes(nodeToRemoveParent, nextNodes);
    }

    this.invalidate();
  }

  async move(node: Node<NodeData>, to: Branch<NodeData>): Promise<void> {
    const initialParent = node.parent ?? this.root;

    if (
      // If the node is already in the target branch, do nothing
      initialParent === to ||
      // You can't move a node to a child of itself
      (isBranch(node) && node.contains(to))
    ) {
      return;
    }

    if (!to.nodes) {
      await this.expand(to);
    }

    // Parent may have changed in the meantime
    if (node.parent === initialParent) {
      if (initialParent?.nodes) {
        const nextNodes: number[] = new Array(
          Math.max(initialParent.nodes.length - 1, 0)
        );
        let found = 0;

        for (let i = 0; i < initialParent.nodes.length; i++) {
          const nodeId = initialParent.nodes[i];

          if (nodeId !== node.id) {
            nextNodes[i - found] = nodeId;
          } else {
            found = 1;
          }
        }

        this.setNodes(initialParent, nextNodes);
      }

      if (to.nodes) {
        node.parentId = to.id;
        const nextNodes = [...to.nodes];
        nextNodes[nextNodes.length] = node.id;
        this.setNodes(to, nextNodes);
      }

      this.invalidate();
    }
  }

  /**
   * Invalidate the list of visible nodes. This is useful for re-rendering your tree
   * when node data changes.
   */
  invalidate(): void {
    this.flatView.setState(this.flatView.getState() + 1);
  }

  /**
   * A more accurate and real-time representation of whether a branch is expanded.
   *
   * `Branch#expanded` represents the "optimistic" expansion state of the branch in
   * question not the actual status, because the child nodes might still need to be
   * loaded before the change can be seen in the tree.
   *
   * @param branch - The branch to check
   */
  isExpanded(branch: Branch<NodeData>): boolean {
    return !!(branch.nodes && branch.expanded);
  }

  /**
   * Returns `true` if the node and its parents are visible in the tree.
   *
   * @param node - The node to check
   */
  isVisible(node: Node<NodeData>): boolean {
    let p = node.parent;

    while (p) {
      if (!p.expanded) return false;
      p = p.parent;
    }

    return true;
  }

  /**
   * You can use this method to manually trigger a reload of a branch in the tree.
   *
   * @param branch - The branch to load nodes for
   */
  async loadNodes(branch: Branch<NodeData>): Promise<void> {
    const promise = this.loadingBranches.get(branch);

    if (!promise) {
      const promise = (async (): Promise<void> => {
        const nodes = await this.getNodes(branch);
        this.setNodes(branch, nodes);

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          if (isBranch(node) && node.expanded) {
            retryWithBackoff(() => this.expand(node), {
              shouldRetry: () => {
                return node.expanded && !this.isExpanded(node);
              },
            }).catch(() => {});
          }
        }
      })();

      promise.finally(() => this.loadingBranches.delete(branch));
      this.loadingBranches.set(branch, promise);
      return promise;
    }

    return promise;
  }

  protected setNodes(
    branch: Branch<NodeData>,
    nodeIds: number[] | Node<NodeData>[]
  ): void {
    const comparator = this.comparator;
    let nodes: Node<NodeData>[] = nodeIds as Node<NodeData>[];

    if (typeof nodeIds[0] === "number") {
      for (let i = 0; i < nodeIds.length; i++) {
        const nodeId = nodeIds[i] as number;
        nodes[i] = this.nodesById[nodeId];
      }
    }

    nodes = comparator ? nodes.sort(comparator) : nodes;

    branch.nodes = new Array(nodes.length);
    this.nodesById[branch.id] = branch;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      branch.nodes[i] = node.id;
      this.nodesById[node.id] = node;
    }
  }

  private createVisibleNodes = memoizeOne(
    (id: number) => {
      const flatView: number[] = [];

      if (this.root.nodes) {
        const nodes: number[] = [...this.root.nodes].reverse();
        let nodeId: number | undefined;

        while ((nodeId = nodes.pop())) {
          flatView.push(nodeId);
          const node = this.nodesById[nodeId];

          if (
            isBranch(node) &&
            node.expanded &&
            node.nodes &&
            node.nodes.length > 0
          ) {
            nodes.push(...[...node.nodes].reverse());
          }
        }
      }

      return flatView;
    },
    (prevArgs, args) => prevArgs[0] === args[0]
  );

  dispose(): void {
    // @ts-expect-error
    nodesById[this.root.id] = undefined;

    for (let i = 0; i < this.visibleNodes.length; i++) {
      // @ts-expect-error
      nodesById[this.visibleNodes[i]] = undefined;
    }
  }
}

function createDraft<NodeData = {}>(
  nodes: ReadonlyArray<Node<NodeData>>
): { draft: Node<NodeData>[]; modified: boolean } {
  const draft = new Proxy([...nodes], {
    set(target, index, value) {
      if (typeof index === "string" || typeof index === "number") {
        target[parseInt(index)] = value;
        draftResult.modified = true;
      }

      return true;
    },
  });

  const draftResult = { draft, modified: false };

  Object.getOwnPropertyNames(Array.prototype).forEach((prop) => {
    switch (prop) {
      case "pop":
      case "push":
      case "shift":
      case "unshift":
      case "reverse":
      case "sort":
      case "splice":
        Object.defineProperty(draft, prop, {
          value: (...args: any[]) => {
            draftResult.modified = true;
            // eslint-disable-next-line prefer-spread
            return Array.prototype[prop].apply(draft, args);
          },
        });
    }
  });

  return draftResult;
}

export function isLeaf<T>(node: Node<T> | undefined): node is Leaf<T> {
  return node instanceof Leaf && !(node instanceof Branch);
}

export function isBranch<T>(node: Node<T> | undefined): node is Branch<T> {
  return node instanceof Branch;
}

export type GetNodes<NodeData = {}> = {
  (parent: Branch<NodeData>): Node<NodeData>[] | Promise<Node<NodeData>[]>;
};
