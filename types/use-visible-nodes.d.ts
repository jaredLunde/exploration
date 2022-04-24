import type { FileTree } from "./file-tree";
/**
 * A hook that observes to updates to the file tree and returns the nodes that
 * are currently visible in the file tree.
 *
 * @param fileTree - A file tree
 * @example
 * ```tsx
 * const visibleNodes = useVisibleNodes(fileTree)
 * return visibleNodes.map((node) => <div className={`depth-${node.depth}`}>{node.basename}</div>)
 * ```
 */
export declare function useVisibleNodes<Meta>(fileTree: FileTree<Meta>): number[];
