import * as React from "react";
import trieMemoize from "trie-memoize";
import type { FileTree } from "./file-tree";
import { ObservableSet } from "./observable-data";
import { useVisibleNodes } from "./use-visible-nodes";

export function useSelections<Meta>(
  fileTree: FileTree<Meta>,
  nodes?: Uint32Array
) {
  const visibleNodes_ = useVisibleNodes(fileTree);
  const visibleNodes = nodes ?? visibleNodes_;
  const prevSelectionsSet = React.useRef<ObservableRange<number> | null>(null);
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
  };
}

const createProps = trieMemoize(
  [WeakMap, WeakMap, Map],
  (
    selectionsSet: ObservableRange<number>,
    visibleNodes: Uint32Array,
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
  <Meta>(fileTree: FileTree<Meta>, visibleNodes: Uint32Array) =>
    new ObservableRange<number>()
);

class ObservableRange<T> extends ObservableSet<T> {
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
