import type { Node } from "./branch";
import { Branch } from "./branch";
import { Leaf } from "./leaf";
import { observable } from "./observable";

export class Tree<NodeData = {}> {
  protected treeNodeMap = new Map<number, Node<NodeData>>();
  private pendingLoadChildrenRequests = new Map<
    Branch<NodeData>,
    Promise<void>
  >();
  private getNodes: GetNodes<NodeData>;
  comparator?: (a: Node<NodeData>, b: Node<NodeData>) => number;
  flatView = observable<number[]>([]);
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
    return this.flatView.getSnapshot();
  }

  getById = (id: number): Node<NodeData> | undefined => {
    return this.treeNodeMap.get(id);
  };

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

      this.createFlatView();
    }
  }

  collapse(branch: Branch<NodeData>): void {
    if (branch.expanded) {
      branch.expanded = false;
      this.createFlatView();
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
      this.createFlatView();
    }
  }

  remove(nodeToRemove: Node<NodeData>): void {
    this.treeNodeMap.delete(nodeToRemove.id);

    if (isBranch(nodeToRemove) && nodeToRemove.nodes) {
      const nodes = nodeToRemove.nodes.slice();
      let node: Node<NodeData> | undefined;

      while ((node = nodes.pop())) {
        this.treeNodeMap.delete(node.id);

        if (isBranch(node) && node.nodes) {
          nodes.push(...node.nodes);
        }
      }
    }

    if (nodeToRemove.parent?.nodes) {
      this.setNodes(
        nodeToRemove.parent,
        nodeToRemove.parent.nodes.filter((n) => n !== nodeToRemove)
      );
    }

    this.createFlatView();
  }

  async move(node: Node<NodeData>, to: Branch<NodeData>): Promise<void> {
    const initialParent = node.parent;

    if (initialParent === to) {
      return;
    }

    if (!to.nodes) {
      await this.expand(to);
    }

    // parent may have changed in the meantime
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

      this.createFlatView();
    }
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
    return !this.findNearestCollapsedParent(node);
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
    this.treeNodeMap.set(branch.id, branch);

    for (let i = 0; i < nodes.length; i++) {
      this.treeNodeMap.set(nodes[i].id, nodes[i]);
    }
  }

  private findNearestCollapsedParent(
    node: Node<NodeData>
  ): Branch<NodeData> | undefined {
    let p = node.parent;

    while (p) {
      if (!p.expanded) return p;
      p = p.parent;
    }
  }

  private createFlatView() {
    const flatView: number[] = [];
    const nodes: Node<NodeData>[] = [];

    if (this.root.nodes) {
      for (let i = this.root.nodes.length - 1; i >= 0; i--) {
        nodes.push(this.root.nodes[i]);
      }

      let node: Node<NodeData> | undefined;

      while ((node = nodes.pop())) {
        flatView.push(node.id);

        if (
          isBranch(node) &&
          node.expanded &&
          node.nodes &&
          node.nodes.length
        ) {
          for (let i = node.nodes.length - 1; i >= 0; i--) {
            nodes.push(node.nodes[i]);
          }
        }
      }
    }

    this.flatView.next(flatView);
  }
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
