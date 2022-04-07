import * as React from "react";
import trieMemoize from "trie-memoize";
import type { FileTree } from "./file-tree";
import { observable } from "./tree/observable";

export function useRovingFocus<Meta>(fileTree: FileTree<Meta>) {
  const [focusedNodeId] = React.useState(() => getFocusedNodeId(fileTree));
  const createProps = React.useMemo(
    () =>
      trieMemoize(
        [Map, Map],
        (nodeId: number, snapshot: number): RovingFocusProps => {
          return {
            tabIndex: snapshot === nodeId ? 0 : -1,

            onFocus(e: React.FocusEvent<HTMLElement>) {
              focusedNodeId.next(nodeId);
            },

            onBlur(e: React.FocusEvent<HTMLElement>) {
              const current = snapshot;

              if (current === nodeId) {
                focusedNodeId.next(-1);
              }
            },
          };
        }
      ),
    [focusedNodeId]
  );

  return {
    didChange: focusedNodeId,
    getProps: (nodeId: number) =>
      createProps(nodeId, focusedNodeId.getSnapshot()),

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
