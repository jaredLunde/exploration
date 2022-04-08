import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { FileTree } from "./file-tree";

export function useVisibleNodes<Meta>(fileTree: FileTree<Meta>) {
  return (
    useSyncExternalStore(
      fileTree.flatViewMap.didChange.subscribe,
      () => fileTree.visibleNodes,
      () => fileTree.visibleNodes
    ) ?? empty
  );
}

const empty = new Uint32Array(0);
