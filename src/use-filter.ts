import * as React from "react";
import type { FileTree, FileTreeNode } from "./file-tree";
import { useDeferredValue } from "./use-deferred-value";
import { useVisibleNodes } from "./use-visible-nodes";

export function useFilter<Meta>(
  tree: FileTree<Meta>,
  filter: (node: FileTreeNode<Meta>, i: number) => boolean
) {
  const visibleNodes = useVisibleNodes(tree);
  const [value, setValue] = React.useState(() => [...visibleNodes]);
  const storedFilter = React.useRef(filter);

  React.useEffect(() => {
    storedFilter.current = filter;
  });

  React.useEffect(() => {
    if (storedFilter.current && tree.visibleNodes) {
      const filteredNodes = [];

      for (let i = 0; i < tree.visibleNodes.length; i++) {
        const node = tree.getById(tree.visibleNodes[i]);

        if (node && storedFilter.current(node, i)) {
          filteredNodes.push(tree.visibleNodes[i]);
        }
      }

      setValue(filteredNodes);
    }
  }, [tree, tree.visibleNodes]);

  return useDeferredValue(value);
}
