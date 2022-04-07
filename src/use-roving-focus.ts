import * as React from "react";
import trieMemoize from "trie-memoize";
import type { FileTree } from "./file-tree";
import { observable } from "./tree/observable";

export function useRovingFocus<Meta>(fileTree: FileTree<Meta>) {
  const [focusedNodeId] = React.useState(() => getFocusedNodeId(fileTree));

  return {
    didChange: focusedNodeId,

    getProps(nodeId: number): RovingFocusProps {
      return {
        tabIndex: focusedNodeId.getSnapshot() === nodeId ? 0 : -1,

        onFocus(e: React.FocusEvent<HTMLElement>) {
          focusedNodeId.next(nodeId);
        },

        onBlur(e: React.FocusEvent<HTMLElement>) {
          const current = focusedNodeId.getSnapshot();

          if (current === nodeId) {
            focusedNodeId.next(-1);
          }
        },
      };
    },

    focus(nodeId: number) {
      focusedNodeId.next(nodeId);
    },

    blur(nodeId: number) {
      const current = focusedNodeId.getSnapshot();

      if (current === nodeId) {
        focusedNodeId.next(-1);
      }
    },
  };
}

const getFocusedNodeId = trieMemoize(
  [WeakMap],
  <Meta>(fileTree: FileTree<Meta>) => observable<number>(-1)
);

export interface RovingFocusProps {
  tabIndex: number;
  onFocus(e: React.FocusEvent<HTMLElement>): void;
  onBlur(e: React.FocusEvent<HTMLElement>): void;
}
