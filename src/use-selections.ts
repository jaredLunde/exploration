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
  const selectionsSet = React.useMemo(
    () => getSelectionsSet(fileTree, visibleNodes),
    [fileTree, visibleNodes]
  );

  return {
    didChange: selectionsSet.didChange,

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
  [WeakMap, Map, Map],
  (
    selectionsSet: ObservableSetWithTail<number>,
    visibleNodes: Uint32Array,
    nodeId: number
  ): SelectionsProps => {
    return {
      onClick(event) {
        if (!visibleNodes) {
          return;
        }

        if (event.shiftKey) {
          const tail = selectionsSet.tail;

          if (tail === nodeId) {
            return;
          }

          let tailIndex = -1;

          if (tail) {
            tailIndex = visibleNodes.indexOf(tail);
          }

          const nodeIndex = visibleNodes.indexOf(nodeId);
          const start = Math.min(tailIndex, nodeIndex);
          const end = Math.max(tailIndex, nodeIndex);

          if (start > -1 && end > -1) {
            for (let i = start + 1; i <= end; i++) {
              const node = visibleNodes[i];

              if (selectionsSet.has(node)) {
                selectionsSet.delete(node);
              } else {
                selectionsSet.add(node);
              }
            }
          }

          selectionsSet.add(nodeId);
        } else if (event.metaKey) {
          if (selectionsSet.has(nodeId)) {
            selectionsSet.delete(nodeId);
          } else {
            selectionsSet.add(nodeId);
          }
        } else {
          selectionsSet.clear();
          selectionsSet.add(nodeId);
        }
      },
    };
  }
);

const getSelectionsSet = trieMemoize(
  [WeakMap, WeakMap],
  <Meta>(fileTree: FileTree<Meta>, visibleNodes: Uint32Array) =>
    new ObservableSetWithTail<number>()
);

export type SelectionsProps = {
  onClick: React.MouseEventHandler<HTMLElement>;
};

class ObservableSetWithTail<T> extends ObservableSet<T> {
  tail: T | null = null;

  add(value: T) {
    super.add(value);
    this.tail = value;
    return this;
  }

  delete(value: T) {
    const deleted = super.delete(value);

    if (this.tail === value) {
      this.tail = getTail(this);
    }

    return deleted;
  }

  clear() {
    super.clear();
    this.tail = null;
    return this;
  }
}

function getTail<T>(set: Set<T>): T | null {
  let value: T | null = null;
  for (value of set);
  return value;
}
