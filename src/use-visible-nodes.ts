import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { FileTree } from "./file-tree";

export function useVisibleNodes<Meta>(tree: FileTree<Meta>) {
  return (
    useSyncExternalStore(
      tree.flatViewMap.didChange.subscribe,
      () => tree.visibleNodes,
      () => tree.visibleNodes
    ) ?? empty
  );
}

const empty = new Uint32Array(0);
