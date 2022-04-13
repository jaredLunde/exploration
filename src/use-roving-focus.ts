import * as React from "react";
import trieMemoize from "trie-memoize";
import type { FileTree } from "./file-tree";
import type { Observable } from "./tree/observable";
import { observable } from "./tree/observable";

export function useRovingFocus<Meta>(fileTree: FileTree<Meta>) {
  const focusedNodeId = React.useMemo(
    () => getFocusedNodeId(fileTree),
    [fileTree]
  );

  return {
    didChange: focusedNodeId,

    getProps: (nodeId: number) => {
      return createProps(
        focusedNodeId,
        nodeId,
        nodeId === focusedNodeId.getSnapshot()
      );
    },
  };
}

const createProps = trieMemoize(
  [WeakMap, Map, Map],
  (
    focusedNodeId: Observable<number>,
    nodeId: number,
    focused: boolean
  ): RovingFocusProps => {
    return {
      tabIndex: focused ? 0 : -1,

      onFocus(e: React.FocusEvent<HTMLElement>) {
        focusedNodeId.next(nodeId);
      },

      onBlur(e: React.FocusEvent<HTMLElement>) {
        if (focused) {
          focusedNodeId.next(-1);
        }
      },
    };
  }
);

const getFocusedNodeId = trieMemoize(
  [WeakMap],
  <Meta>(fileTree: FileTree<Meta>) => observable<number>(-1)
);

export interface RovingFocusProps {
  tabIndex: number;
  onFocus(e: React.FocusEvent<HTMLElement>): void;
  onBlur(e: React.FocusEvent<HTMLElement>): void;
}
