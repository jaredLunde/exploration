import type { FileTree, FileTreeNode } from "./file-tree";
/**
 * A hook that returns a new visible nodes based on a filter function.
 *
 * @param fileTree - The file tree to use.
 * @param filter - A _stable_ callback that returns `true` if the node should be visible.
 *   This needs to be memoized or hoisted to the top level to ensure the filtered nodes
 *   only get re-generated when the filter changes or the file tree's visible nodes change.
 */
export declare function useFilter<Meta>(
  fileTree: FileTree<Meta>,
  filter: ((node: FileTreeNode<Meta>, i: number) => boolean) | null
): number[];
