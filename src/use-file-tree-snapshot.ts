import type { FileTree } from "./file-tree";
import { isDir } from "./file-tree";
import type { FileTreeSnapshot } from "./types";
import { useObserver } from "./use-observer";

/**
 * Take a snapshot of the expanded and buried directories of a file tree.
 * This snapshot can be used to restore the expanded/collapsed state of the
 * file tree when you initially load it.
 *
 * @param fileTree - A file tree
 * @param observer - A callback that handles the file tree snapshot
 */
export function useFileTreeSnapshot<Meta>(
  fileTree: FileTree<Meta>,
  observer: (state: FileTreeSnapshot) => Promise<void> | void
) {
  useObserver(fileTree.flatView, () => {
    const expandedPaths: string[] = [];
    const nodeIds = [...fileTree.visibleNodes];
    const buriedIds: number[] = [];
    let nodeId: number | undefined;

    while ((nodeId = nodeIds.pop())) {
      const node = fileTree.getById(nodeId);

      if (node && isDir(node)) {
        if (node.expanded) {
          expandedPaths.push(node.path);
        } else if (node.nodes) {
          buriedIds.push(...node.nodes);
        }
      }
    }

    const buriedPaths: string[] = [];

    while ((nodeId = buriedIds.pop())) {
      const node = fileTree.getById(nodeId);

      if (!node) continue;
      if (isDir(node)) {
        if (node.expanded) {
          buriedPaths.push(node.path);
        }

        if (node.nodes) {
          buriedIds.push(...node.nodes);
        }
      }
    }

    observer({ expandedPaths, buriedPaths, version: SNAPSHOT_VERSION })?.catch(
      () => {}
    );
  });
}

const SNAPSHOT_VERSION = 1;
