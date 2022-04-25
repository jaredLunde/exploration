import * as React from "react";
import trieMemoize from "trie-memoize";
import type { FileTree } from "./file-tree";
import { SubjectSet } from "./observable-data";
import { nodesById } from "./tree/nodes-by-id";
import type { Subject } from "./tree/subject";
import { useVisibleNodes } from "./use-visible-nodes";

/**
 * A hook for adding select and multi-select to the file tree.
 *
 * @param fileTree - A file tree
 * @param nodes - When using a hook like `useFilter` you can supply the filtered list of
 *   nodes to this option. By default, `useVirtualize()` uses the nodes returned by
 *   `useVisibleNodes()`
 */
export function useSelections<Meta>(
  fileTree: FileTree<Meta>,
  nodes?: number[]
): UseSelectionsPlugin {
  const visibleNodes_ = useVisibleNodes(fileTree);
  const visibleNodes = nodes ?? visibleNodes_;
  const prevSelectionsSet = React.useRef<SubjectRange<number> | null>(null);
  const selectionsSet = React.useMemo(() => {
    const next = getSelectionsSet(fileTree, visibleNodes);

    if (prevSelectionsSet.current) {
      for (const nodeId of prevSelectionsSet.current) {
        next.add(nodeId);
      }
    }

    return next;
  }, [fileTree, visibleNodes]);

  React.useEffect(() => {
    prevSelectionsSet.current = selectionsSet;
  }, [selectionsSet]);

  return {
    didChange: selectionsSet.didChange,

    get head() {
      return selectionsSet.head;
    },

    get tail() {
      return selectionsSet.tail;
    },

    getProps(nodeId: number) {
      return createProps(selectionsSet, visibleNodes, nodeId);
    },

    select(...nodeIds: number[]) {
      for (const nodeId of nodeIds) {
        selectionsSet.add(nodeId);
      }
    },

    deselect(...nodeIds: number[]) {
      for (const nodeId of nodeIds) {
        selectionsSet.delete(nodeId);
      }
    },

    clear() {
      selectionsSet.clear();
    },

    narrow: function* () {
      // Remove child nodes from selections if their parent is already selected
      for (const nodeId of selectionsSet) {
        const node = nodesById[nodeId];

        if (node) {
          let parentId = node.parentId;

          while (parentId > -1) {
            if (selectionsSet.has(parentId)) {
              break;
            }

            const parentNode = nodesById[parentId];

            if (!parentNode) {
              break;
            }

            parentId = parentNode.parentId;
          }

          if (parentId === -1) {
            yield nodeId;
          }
        }
      }
    },
  };
}

const createProps = trieMemoize(
  [WeakMap, WeakMap, Map],
  (
    selectionsSet: SubjectRange<number>,
    visibleNodes: number[],
    nodeId: number
  ): SelectionsProps => {
    return {
      onClick(event) {
        if (!visibleNodes) {
          return;
        }

        if (event.shiftKey) {
          const { head, tail } = selectionsSet;
          const headIndex = !head ? -1 : visibleNodes.indexOf(head);
          const tailIndex = !tail ? -1 : visibleNodes.indexOf(tail);
          const nodeIndex = visibleNodes.indexOf(nodeId);
          const direction = tailIndex > nodeIndex ? -1 : 1;

          // Select range
          let selectStart = tailIndex;
          let selectEnd = nodeIndex;

          if (direction === 1) {
            selectStart = tailIndex;
          } else {
            selectStart = nodeIndex;
            selectEnd = tailIndex;
          }

          if (selectStart > -1 && selectEnd > -1) {
            for (let i = selectStart; i <= selectEnd; i++) {
              const node = visibleNodes[i];
              selectionsSet.add(node);
            }
          }

          // Deselect range
          let deselectStart = -1;
          let deselectEnd = -1;

          if (direction === 1 && headIndex > tailIndex) {
            deselectStart = tailIndex;
            deselectEnd = Math.min(headIndex, nodeIndex) - 1;
          } else if (direction === -1 && headIndex < tailIndex) {
            deselectStart = Math.max(headIndex, nodeIndex) + 1;
            deselectEnd = tailIndex;
          }

          if (deselectStart > -1 && deselectEnd > -1) {
            for (let i = deselectStart; i <= deselectEnd; i++) {
              const node = visibleNodes[i];
              selectionsSet.delete(node);
            }
          }

          if (selectionsSet.head === null) {
            selectionsSet.head = nodeId;
          }
        } else if (event.metaKey) {
          if (selectionsSet.has(nodeId)) {
            selectionsSet.delete(nodeId);
          } else {
            selectionsSet.add(nodeId);
          }

          selectionsSet.head = nodeId;
        } else {
          selectionsSet.clear();
          selectionsSet.add(nodeId);
          selectionsSet.head = nodeId;
        }

        selectionsSet.tail = nodeId;
      },
    };
  }
);

const getSelectionsSet = trieMemoize(
  [WeakMap, WeakMap],
  <Meta>(fileTree: FileTree<Meta>, visibleNodes: number[]) =>
    new SubjectRange<number>()
);

class SubjectRange<T> extends SubjectSet<T> {
  head: T | null = null;
  tail: T | null = null;

  add(value: T) {
    super.add(value);

    if (this.head === null) {
      this.head = value;
    }

    this.tail = value;
    return this;
  }

  delete(value: T) {
    const deleted = super.delete(value);
    return deleted;
  }

  clear() {
    super.clear();
    this.head = null;
    this.tail = null;
    return this;
  }
}

export interface SelectionsProps {
  onClick: React.MouseEventHandler<HTMLElement>;
}

export interface UseSelectionsPlugin {
  /**
   * A subject that you can use to observe to changes to selections.
   */
  didChange: Subject<Set<number>>;
  /**
   * Get the React props for a given node ID.
   *
   * @param nodeId - A node ID
   */
  getProps(nodeId: number): SelectionsProps;
  /**
   * The head of the selections list
   */
  get head(): number | null;
  /**
   * The tail of the selections list
   */
  get tail(): number | null;
  /**
   * Select given node ids
   *
   * @param nodeIds - Node IDs
   */
  select(...nodeIds: number[]): void;
  /**
   * Deselect given node ids
   *
   * @param nodeIds - Node IDs
   */
  deselect(...nodeIds: number[]): void;
  /**
   * Clear all of the selections
   */
  clear(): void;
  /**
   * A utility function that yields nodes from a set of selections if they
   * don't have a parent node in the set.
   *
   * @yields {number} - A node id
   */
  narrow(): Generator<number, void, unknown>;
}
