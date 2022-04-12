import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { FileTree } from "./file-tree";

export function useVisibleNodes<Meta>(fileTree: FileTree<Meta>) {
  return (
    useSyncExternalStore(
      fileTree.flatView.subscribe,
      fileTree.flatView.getSnapshot,
      fileTree.flatView.getSnapshot
    ) ?? empty
  );
}

const empty: number[] = [];
