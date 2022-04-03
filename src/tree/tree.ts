import { Branch } from "./branch";
import { FlatViewMap } from "./flat-view-map";
import { Leaf } from "./leaf";
import type { Node, NodeComparator, NodeFactory, Source } from "./types";
import { spliceTypedArray } from "./utils";

export class Tree<NodeData = {}> {
  protected rootBranch: Branch<NodeData>;
  private flatViewMap = new FlatViewMap();
  private treeNodeMap = new Map<number, Node<NodeData>>();
  private pendingLoadChildrenRequests = new Map<
    Branch<NodeData>,
    Promise<void>
  >();
  private onVisibleNodesChangeCallback: () => void = () => {};

  constructor(private source: Source<NodeData>, rootBranchData: NodeData) {
    this.rootBranch = new Branch(this.nextId(), null, rootBranchData);
    let didSetInitial = false;
    this.flatViewMap.onDidSetKey = (key: number): void => {
      if (didSetInitial && key === this.rootBranch.id) {
        return this.onVisibleNodesChangeCallback();
      }

      didSetInitial = true;
    };
    this.expand(this.rootBranch);
  }

  onVisibleNodesChange(cb: () => void): void {
    this.onVisibleNodesChangeCallback = cb;
  }

  get root(): Branch<NodeData> {
    return this.rootBranch;
  }

  get visibleNodes(): Uint32Array | undefined {
    return this.flatViewMap.get(this.rootBranch.id);
  }

  getById(id: number): Node<NodeData> | undefined {
    return this.treeNodeMap.get(id);
  }

  /**
   * Ensures that the children of any given branch have been loaded and ready to be worked with.
   *
   * Call this method without any arguments to check if the root branch is loaded.
   *
   * ⚠ "Loaded" doesn't mean expanded, it just means the contents are "ready". Except when no arguments are given, the
   * branch being checked is root, and root is always expanded.
   *
   * @param branch
   */
  async ensureLoaded(
    branch: Branch<NodeData> = this.rootBranch
  ): Promise<void> {
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
      this.connectBranchToClosestFlatView(branch, ensureVisible);

      if (recursive && branch.nodes) {
        await Promise.all(
          branch.nodes.map((node) =>
            isBranch(node) ? this.expand(node, options) : null
          )
        );
      }
    }
  }

  collapse(branch: Branch<NodeData>): void {
    if (branch.expanded) {
      this.disconnectBranchFromClosestFlatView(branch);
    }
  }

  produce(branch: Branch<NodeData>, produceFn: BranchProducer<NodeData>): void {
    let draftResult = createDraft(branch.nodes ?? []);
    const factory = this.getNodeFactory(branch);

    const insertNode = <NodeType extends Node<NodeData>>(
      node: NodeType,
      insertionIndex?: number
    ): NodeType => {
      draftResult.modified = true;
      draftResult.draft.splice(insertionIndex ?? Infinity, 0, node);
      return node;
    };

    draftResult.draft =
      produceFn({
        get draft() {
          return draftResult.draft;
        },
        createBranch: factory.createBranch,
        createLeaf: factory.createLeaf,
        insertBranch(data: NodeData, insertionIndex?: number) {
          return insertNode(factory.createBranch(data), insertionIndex);
        },
        insertLeaf(data: NodeData, insertionIndex?: number) {
          return insertNode(factory.createLeaf(data), insertionIndex);
        },
        sort(comparatorFn: NodeComparator<NodeData>) {
          draftResult.modified = true;
          draftResult.draft.sort(comparatorFn);
        },
        revert() {
          draftResult = createDraft(branch.nodes ?? []);
        },
      }) ?? draftResult.draft;

    if (draftResult.modified) {
      this.setNodes(branch, draftResult.draft);
    }
  }

  remove(nodeToRemove: Node<NodeData>): void {
    // TODO: dispatch remove event
    this.removeNodeFromFlatView(nodeToRemove);
    this.treeNodeMap.delete(nodeToRemove.id);

    if (isBranch(nodeToRemove) && nodeToRemove.nodes) {
      const nodes = nodeToRemove.nodes.slice();
      let node: Node<NodeData> | undefined;

      while ((node = nodes.pop())) {
        this.removeNodeFromFlatView(node);
        this.treeNodeMap.delete(node.id);

        if (isBranch(node) && node.nodes) {
          // eslint-disable-next-line prefer-spread
          nodes.push.apply(nodes, node.nodes);
        }
      }
    }

    if (nodeToRemove.parent?.nodes) {
      nodeToRemove.parent.nodes = nodeToRemove.parent.nodes.filter(
        (n) => n !== nodeToRemove
      );
    }
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
      if (isBranch(node)) {
        this.disconnectBranchFromClosestFlatView(node);
      }

      if (initialParent?.nodes) {
        this.setNodes(
          initialParent,
          initialParent.nodes.filter((n) => n !== node)
        );
      }

      if (to.nodes) {
        this.setNodes(to, to.nodes.concat(node));
        node.parent = to;
      }

      if (isBranch(node)) {
        this.connectBranchToClosestFlatView(node);
      }
    }
  }

  /**
   * A more accurate and real-time representation of whether a branch is expanded.
   *
   * `Branch#expanded` represents the "optimistic" expansion state of the branch in
   * question not the actual status, because the child nodes might still need to be
   * loaded before the change can be seen in the tree.
   *
   * @param branch
   */
  isExpanded(branch: Branch<NodeData>): boolean {
    return !!(
      branch.nodes &&
      branch.expanded &&
      !this.flatViewMap.has(branch.id)
    );
  }

  isVisible(node: Node<NodeData>): boolean {
    return !this.findClosestDisconnectedParent(node);
  }

  protected nextId = (
    (genesis = 0) =>
    (): number =>
      genesis++
  )();

  private async loadNodes(branch: Branch<NodeData>): Promise<void> {
    const promise = this.pendingLoadChildrenRequests.get(branch);

    if (!promise) {
      const promise = (async (): Promise<void> => {
        if (branch) {
          const nodes = await this.source.getNodes(
            branch,
            this.getNodeFactory(branch)
          );

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

  private setNodes(branch: Branch<NodeData>, nodes: Node<NodeData>[]): void {
    const restoreExpansionQueue: Branch<NodeData>[] = [];

    if (branch.expanded) {
      this.disconnectBranchFromClosestFlatView(branch);
      restoreExpansionQueue.unshift(branch);
    }

    if (branch.nodes) {
      for (let i = 0; i < branch.nodes.length; i++) {
        const node = branch.nodes[i];
        // if a child branch is expanded, we must disconnect it (will be reconnected later)
        if (isBranch(node) && node.expanded) {
          this.disconnectBranchFromClosestFlatView(node);
          restoreExpansionQueue.unshift(node);
        }
      }
    }

    branch.nodes! = nodes;
    const flatView = new Uint32Array(branch.nodes.length);

    if (branch === this.root) {
      this.treeNodeMap.set(branch.id, branch);
    }

    for (let i = 0; i < branch.nodes.length; i++) {
      const child = branch.nodes[i];
      flatView[i] = child.id;
      this.treeNodeMap.set(child.id, child);
    }

    // save the updated flat projection
    this.flatViewMap.set(branch.id, flatView);

    for (let i = 0; i < restoreExpansionQueue.length; i++) {
      this.connectBranchToClosestFlatView(restoreExpansionQueue[i]);
    }
  }

  protected getNodeFactory(
    branch: Branch<NodeData> | null
  ): NodeFactory<NodeData> {
    return {
      createBranch: (data: NodeData, expanded?: boolean): Branch<NodeData> =>
        new Branch(this.nextId(), branch, data, expanded),
      createLeaf: (data: NodeData): Leaf<NodeData> =>
        new Leaf(this.nextId(), branch, data),
    };
  }

  private removeNodeFromFlatView(node: Node<NodeData>): void {
    // if the node (branch) was in a disconnected state, remove its records
    this.flatViewMap.delete(node.id);
    // proceed with the complete removal from the shadow parent
    const shadowParent =
      this.findClosestDisconnectedParent(node) ?? this.rootBranch;
    const parentFlatView = this.flatViewMap.get(shadowParent.id);

    if (parentFlatView) {
      const { start, end } = this.getNodeProjectionRangeWithinFlatView(
        parentFlatView,
        node
      );

      const spliced = spliceTypedArray(parentFlatView, start, end - start)[0];

      if (isBranch(node)) {
        node.expanded = false;
      }

      this.flatViewMap.set(shadowParent.id, spliced);
    }
  }

  private disconnectBranchFromClosestFlatView(branch: Branch<NodeData>): void {
    // if is NOT root branch, and is connected to a shadow parent
    if (!this.isRootBranch(branch) && !this.flatViewMap.has(branch.id)) {
      const shadowParent =
        this.findClosestDisconnectedParent(branch) || this.rootBranch;
      const parentFlatView = this.flatViewMap.get(shadowParent.id);

      if (parentFlatView) {
        const { start, end } = this.getNodeProjectionRangeWithinFlatView(
          parentFlatView,
          branch
        );
        const [spliced, deleted] = spliceTypedArray(
          parentFlatView,
          start + 1,
          end - start - 1
        );

        branch.expanded = false;
        this.flatViewMap.set(shadowParent.id, spliced);
        this.flatViewMap.set(branch.id, deleted);
      }
    }
  }

  private connectBranchToClosestFlatView(
    branch: Branch<NodeData>,
    liftToRoot = false
  ): void {
    const shadowParent =
      this.findClosestDisconnectedParent(branch) || this.rootBranch;

    // if is NOT root branch, and is disconnected from its shadow parent
    if (!this.isRootBranch(branch) && this.flatViewMap.has(branch.id)) {
      const parentFlatView = this.flatViewMap.get(shadowParent.id);

      if (parentFlatView) {
        const fromIdx = parentFlatView.indexOf(branch.id) + 1;
        const selfFlatView = this.flatViewMap.get(branch.id);
        const spliced = spliceTypedArray(
          parentFlatView,
          fromIdx,
          0,
          selfFlatView
        )[0];

        branch.expanded = true;
        this.flatViewMap.set(shadowParent.id, spliced);
        this.flatViewMap.delete(branch.id);
      }
    }

    if (liftToRoot && !this.isRootBranch(shadowParent)) {
      this.connectBranchToClosestFlatView(shadowParent, true);
    }
  }

  private isRootBranch(branch: Branch<NodeData>): boolean {
    return branch === this.rootBranch;
  }

  private findClosestDisconnectedParent(
    node: Node<NodeData>
  ): Branch<NodeData> | undefined {
    let p = node.parent;

    while (p) {
      if (!p.expanded) return p;
      p = p.parent;
    }
  }

  private getNodeProjectionRangeWithinFlatView(
    flatView: Uint32Array,
    node: Node<NodeData>
  ): { start: number; end: number } {
    let b = node;

    // keep walking up until we find a branch that is NOT the last child of its parent
    while (b.parent?.nodes?.[b.parent.nodes.length - 1] === b) {
      b = b.parent;
    }

    const startIndex = flatView.indexOf(node.id);

    if (b.parent?.nodes) {
      // once we have that, just return the immediate next sibling node
      const nextSibling = b.parent.nodes[b.parent.nodes.indexOf(b) + 1];
      const endIndex = flatView.indexOf(nextSibling.id);

      return {
        start: startIndex,
        end: endIndex > -1 ? endIndex : flatView.length,
      };
    }

    return { start: startIndex, end: -1 };
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

export type BranchProducer<NodeData = {}> = {
  (ctx: BranchProduceContext<NodeData>): Node<NodeData>[] | void;
};

export type BranchProduceContext<NodeData = {}> = {
  draft: Node<NodeData>[];
  createBranch(data: NodeData, expanded?: boolean): Branch<NodeData>;
  createLeaf(data: NodeData): Leaf<NodeData>;
  /**
   * Realtime representation of nodes of the target branch. This is a readonly copy that updates after any operation is performed.
   *
   * It starts of with the current child nodes of the branch, and mutates as you run operation on it. The mutations will be commited
   * to the actual tree after the produce function returns. Calling `revertChanges` will reset the copy back to how it was and no changes
   * will be saved.
   */
  insertLeaf(data: NodeData, insertionIndex?: number): Leaf<NodeData>;
  insertBranch(data: NodeData, insertionIndex?: number): Branch<NodeData>;
  sort(comparatorFn: NodeComparator<NodeData>): void;
  revert(): void;
};
