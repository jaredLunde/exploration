import * as React from "react";
import type { FileTree, FileTreeNode } from "./file-tree";
import { useDeferredValue } from "./use-deferred-value";
import { useVisibleNodes } from "./use-visible-nodes";

export function useFilter<Meta>(
  tree: FileTree<Meta>,
  filter: ((node: FileTreeNode<Meta>, i: number) => boolean) | null
) {
  const visibleNodes = useVisibleNodes(tree);

  const value = React.useMemo(() => {
    if (filter) {
      const filteredNodes = [];

      for (let i = 0; i < visibleNodes.length; i++) {
        const node = tree.getById(visibleNodes[i]);

        if (node && filter(node, i)) {
          filteredNodes.push(visibleNodes[i]);
        }
      }

      return filteredNodes;
    }

    return visibleNodes;
  }, [tree, visibleNodes, filter]);

  return useDeferredValue(value);
}
