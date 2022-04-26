import type { FileTree } from "./file-tree";
import type { FileTreeSnapshot } from "./types";
/**
 * Take a snapshot of the expanded and buried directories of a file tree.
 * This snapshot can be used to restore the expanded/collapsed state of the
 * file tree when you initially load it.
 *
 * @param fileTree - A file tree
 * @param observer - A callback that handles the file tree snapshot
 */
export declare function useFileTreeSnapshot<Meta>(fileTree: FileTree<Meta>, observer: (state: FileTreeSnapshot) => Promise<void> | void): void;
