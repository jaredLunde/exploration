import memoizeOne from "@essentials/memoize-one";
import type { Node } from "./branch";
import { Branch } from "./branch";
import { Leaf } from "./leaf";
import { observable } from "./observable";

export class Tree<NodeData = {}> {
  protected treeNodesById: (Node<NodeData> | undefined)[] = [];
  private pendingLoadChildrenRequests = new Map<
    Branch<NodeData>,
    Promise<void>
  >();
  private getNodes: GetNodes<NodeData>;
  comparator?: (a: Node<NodeData>, b: Node<NodeData>) => number;
  flatView = observable<number>(0);
  root: Branch<NodeData>;

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
    this.expand(this.root);
  }

  get visibleNodes(): number[] {
    return this.createFlatView(this.flatView.getSnapshot());
  }

  getById(id: number): Node<NodeData> | undefined {
    return this.treeNodesById[id];
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
          branch = branch.parent;
          branch.expanded = true;
        }
      }

      if (recursive && branch.nodes) {
        await Promise.all(
          branch.nodes.map((node) =>
            isBranch(node) ? this.expand(node, options) : null
          )
        );
      }

      this.invalidateFlatView();
    }
  }

  collapse(branch: Branch<NodeData>): void {
    if (branch.expanded) {
      branch.expanded = false;
      this.invalidateFlatView();
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
    let draftResult = createDraft(branch.nodes ?? []);

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
        revert() {
          draftResult = createDraft(branch.nodes ?? []);
        },
      }) ?? draftResult.draft;

    if (draftResult.modified) {
      this.setNodes(branch, draftResult.draft);
      this.invalidateFlatView();
    }
  }

  remove(nodeToRemove: Node<NodeData>): void {
    if (isBranch(nodeToRemove) && nodeToRemove.nodes) {
      const nodes = nodeToRemove.nodes.slice();
      this.treeNodesById[nodeToRemove.id] = undefined;
      let node: Node<NodeData> | undefined;

      while ((node = nodes.pop())) {
        this.treeNodesById[node.id] = undefined;

        if (isBranch(node) && node.nodes) {
          nodes.push(...node.nodes);

          for (let i = 0; i < node.nodes.length; i++) {
            this.treeNodesById[node.nodes[i].id] = undefined;
          }
        }
      }
    }

    if (nodeToRemove.parent?.nodes) {
      this.setNodes(
        nodeToRemove.parent,
        nodeToRemove.parent.nodes.filter((n) => n !== nodeToRemove)
      );
    }

    this.invalidateFlatView();
  }

  async move(node: Node<NodeData>, to: Branch<NodeData>): Promise<void> {
    const initialParent = node.parent;

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
        this.setNodes(
          initialParent,
          initialParent.nodes.filter((n) => n !== node)
        );
      }

      if (to.nodes) {
        node.parent = to;
        this.setNodes(to, to.nodes.concat(node));
      }

      this.invalidateFlatView();
    }
  }

  invalidateFlatView(): void {
    this.flatView.next(this.flatView.getSnapshot() + 1);
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

  isVisible(node: Node<NodeData>): boolean {
    let p = node.parent;

    while (p) {
      if (!p.expanded) return false;
      p = p.parent;
    }

    return true;
  }

  async loadNodes(branch: Branch<NodeData>): Promise<void> {
    const promise = this.pendingLoadChildrenRequests.get(branch);

    if (!promise) {
      const promise = (async (): Promise<void> => {
        if (branch) {
          const nodes = await this.getNodes(branch);
          this.setNodes(branch, nodes);

          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            if (isBranch(node) && node.expanded) {
              this.expand(node);
            }
          }
        }
      })();

      promise.finally(() => this.pendingLoadChildrenRequests.delete(branch));
      this.pendingLoadChildrenRequests.set(branch, promise);
    }

    return promise;
  }

  protected setNodes(branch: Branch<NodeData>, nodes: Node<NodeData>[]): void {
    branch.nodes = this.comparator ? nodes.sort(this.comparator) : nodes;
    this.treeNodesById[branch.id] = branch;

    for (let i = 0; i < nodes.length; i++) {
      this.treeNodesById[nodes[i].id] = nodes[i];
    }
  }

  private createFlatView = memoizeOne(
    (id: number) => {
      const flatView: number[] = [];
      const nodes: Node<NodeData>[] = [];

      if (this.root.nodes) {
        nodes.push(...[...this.root.nodes].reverse());

        let node: Node<NodeData> | undefined;

        while ((node = nodes.pop())) {
          flatView.push(node.id);

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
}

function createDraft<NodeData = {}>(
  nodes: ReadonlyArray<Node<NodeData>>
): { draft: Node<NodeData>[]; modified: boolean } {
  const draft = new Proxy(nodes.slice(), {
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

export function isLeaf<T>(node: Node<T>): node is Leaf<T> {
  return node instanceof Leaf && !(node instanceof Branch);
}

export function isBranch<T>(node: Node<T>): node is Branch<T> {
  return node instanceof Branch;
}

export type GetNodes<NodeData = {}> = {
  (parent: Branch<NodeData>): Node<NodeData>[] | Promise<Node<NodeData>[]>;
};
