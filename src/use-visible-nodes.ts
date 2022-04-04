import React from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { FileTree } from "./file-tree";

export function useVisibleNodes<Meta>(tree: FileTree<Meta>) {
  const store = React.useMemo(
    () => ({
      subscribe(callback: () => void) {
        return tree.flatViewMap.didChange.subscribe(callback);
      },
      getSnapshot() {
        return tree.visibleNodes;
      },
    }),
    [tree]
  );

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
