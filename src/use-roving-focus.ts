import * as React from "react";
import trieMemoize from "trie-memoize";
import type { FileTree } from "./file-tree";
import type { Subject } from "./tree/subject";
import { subject } from "./tree/subject";

/**
 * A plugin hook for adding roving focus to file tree nodes.
 *
 * @param fileTree - A file tree
 */
export function useRovingFocus<Meta>(
  fileTree: FileTree<Meta>
): UseRovingFocusPlugin {
  const focusedNodeId = React.useMemo(
    () => getFocusedNodeId(fileTree),
    [fileTree]
  );

  return {
    didChange: focusedNodeId,

    getProps(nodeId) {
      return createProps(
        focusedNodeId,
        nodeId,
        nodeId === focusedNodeId.getState()
      );
    },
  };
}

const createProps = trieMemoize(
  [WeakMap, Map, Map],
  (
    focusedNodeId: Subject<number>,
    nodeId: number,
    focused: boolean
  ): RovingFocusProps => {
    return {
      tabIndex: focused ? 0 : -1,

      onFocus() {
        focusedNodeId.setState(nodeId);
      },

      onBlur() {
        if (focused) {
          focusedNodeId.setState(-1);
        }
      },
    };
  }
);

const getFocusedNodeId = trieMemoize(
  [WeakMap],
  <Meta>(fileTree: FileTree<Meta>) => subject<number>(-1)
);

export interface RovingFocusProps {
  tabIndex: number;
  onFocus(e: React.FocusEvent<HTMLElement>): void;
  onBlur(e: React.FocusEvent<HTMLElement>): void;
}

export interface UseRovingFocusPlugin {
  /**
   * A subject that you can use to observe to changes to the focused node.
   */
  didChange: Subject<number>;
  /**
   * Get the React props for a given node ID.
   *
   * @param nodeId - A node ID
   */
  getProps: (nodeId: number) => RovingFocusProps;
}
