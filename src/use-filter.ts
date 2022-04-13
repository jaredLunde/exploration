import * as React from "react";
import type { FileTree, FileTreeNode } from "./file-tree";
import { useDeferredValue } from "./use-deferred-value";
import { useVisibleNodes } from "./use-visible-nodes";

/**
 * A hook that returns a new visible nodes based on a filter function.
 *
 * @param fileTree - The file tree to use.
 * @param filter - A _stable_ callback that returns `true` if the node should be visible.
 *   This needs to be memoized or hoisted to the top level to ensure the filtered nodes
 *   only get re-generated when the filter changes or the file tree's visible nodes change.
 */
export function useFilter<Meta>(
  fileTree: FileTree<Meta>,
  filter: ((node: FileTreeNode<Meta>, i: number) => boolean) | null
) {
  const visibleNodes = useVisibleNodes(fileTree);

  const value = React.useMemo(() => {
    if (filter) {
      const filteredNodes = [];

      for (let i = 0; i < visibleNodes.length; i++) {
        const nodeId = visibleNodes[i];
        const node = fileTree.getById(nodeId);

        if (node && filter(node, i)) {
          filteredNodes.push(nodeId);
        }
      }

      return filteredNodes;
    }

    return visibleNodes;
  }, [fileTree, visibleNodes, filter]);

  return useDeferredValue(value);
}
