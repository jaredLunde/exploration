import { Branch } from "./tree/branch";
import { Leaf } from "./tree/leaf";
import type { GetNodes as GetNodesBase } from "./tree/tree";
import { Tree } from "./tree/tree";
import type { FileTreeSnapshot } from "./types";
/**
 * Create a file tree that can be used with the React API.
 *
 * @param getNodes - A function that returns the nodes of the file tree.
 * @param config - Configuration options for the file tree.
 * @param config.comparator - A function that compares two nodes for sorting.
 * @param config.root - The root node data of the file tree.
 */
export declare function createFileTree<Meta = {}>(
  getNodes: GetNodes<Meta>,
  config?: FileTreeConfig<Meta>
): FileTree<Meta>;
export declare class FileTree<Meta = {}> extends Tree<FileTreeData<Meta>> {
  /**
   * The root directory of the file tree
   */
  root: Dir<Meta>;
  protected treeNodeMap: Map<number, File<Meta> | Dir<Meta>>;
  nodesById: FileTreeNode<Meta>[];
  protected loadingBranches: Map<Dir<Meta>, Promise<void>>;
  /**
   * Get a node by its ID.
   *
   * @param id - The ID of the node
   */
  getById: (id: number) => FileTreeNode<Meta> | undefined;
  /**
   * Expand a directory in the tree.
   *
   * @param dir - The directory to expand
   * @param options - Options for expanding the directory
   */
  expand: (
    dir: Dir<Meta>,
    options?: {
      /**
       * Ensure that the directory's parents are visible in the tree, as well.
       */
      ensureVisible?: boolean;
      /**
       * Expand all of the directory's child directories.
       */
      recursive?: boolean;
    }
  ) => Promise<void>;
  /**
   * Collapse a directory in the tree.
   *
   * @param dir - The directory to collapse
   */
  collapse: (dir: Dir<Meta>) => void;
  /**
   * Remove a node and its descendants from the tree.
   */
  remove: (node: FileTreeNode<Meta>) => void;
  /**
   * You can use this method to manually trigger a reload of a directory in the tree.
   *
   * @param dir - The branch to load nodes for
   */
  loadNodes: (dir: Dir<Meta>) => Promise<void>;
  constructor({
    getNodes,
    comparator,
    root,
  }: {
    getNodes: GetNodesBase<FileTreeData<Meta>>;
    comparator: (a: FileTreeNode<Meta>, b: FileTreeNode<Meta>) => number;
    root: Dir<Meta>;
  });
  /**
   * Produce a new tree with the given function applied to the given node.
   * This is similar to `immer`'s produce function as you're working on a draft
   * and can freely mutate the object.
   *
   * @param dir - The directory to produce the tree for
   * @param produceFn - The function to produce the tree with
   */
  produce(
    dir: Dir<Meta>,
    produceFn: (
      context: FileTreeFactory<Meta> & {
        /**
         * The draft of the directory.
         */
        get draft(): FileTreeNode<Meta>[];
        /**
         * Insert a node into the draft.
         *
         * @param node - The node to insert
         */
        insert<NodeType extends FileTreeNode<Meta>>(node: NodeType): NodeType;
        /**
         * Revert the draft back to its original state.
         */
        revert(): void;
      }
    ) => void | (Dir<Meta> | File<Meta>)[]
  ): void;
  /**
   * Move a node to a new parent.
   *
   * @param node - The node to move
   * @param to - The new parent
   */
  move(node: FileTreeNode<Meta>, to: Dir<Meta>): Promise<void>;
  /**
   * Create a new file in a given directory.
   *
   * @param inDir - The directory to create the file in
   * @param withData - The data for the file
   */
  newFile(inDir: Dir<Meta>, withData: FileTreeData<Meta>): void;
  /**
   * Create a new directory in a given directory.
   *
   * @param inDir - The directory to create the directory in
   * @param withData - The data for the directory
   * @param expanded - Whether the directory should be expanded by default
   */
  newDir(
    inDir: Dir<Meta>,
    withData: FileTreeData<Meta>,
    expanded?: boolean
  ): void;
  /**
   * Rename a node.
   *
   * @param node - The node to rename
   * @param newName - The new name for the node
   */
  rename(node: FileTreeNode<Meta>, newName: string): void;
}
export declare class File<Meta = {}> extends Leaf<FileTreeData<Meta>> {
  /**
   * The parent directory of the file
   */
  get parent(): Dir<Meta> | null;
  /**
   * The basename of the file
   */
  get basename(): string;
  /**
   * The full path of the file
   */
  get path(): string;
}
export declare class Dir<Meta = {}> extends Branch<FileTreeData<Meta>> {
  /**
   * The parent directory of this directory
   */
  get parent(): Dir<Meta> | null;
  /**
   * The basename of the directory
   */
  get basename(): string;
  /**
   * The full path of the directory
   */
  get path(): string;
}
/**
 * A sort comparator for sorting path names
 *
 * @param a - A tree node
 * @param b - A tree node to compare against `a`
 */
export declare function defaultComparator(
  a: FileTreeNode,
  b: FileTreeNode
): number;
/**
 * Returns `true` if the given node is a file
 *
 * @param treeNode - A tree node
 */
export declare function isFile<T>(
  treeNode: FileTreeNode<T>
): treeNode is File<T>;
/**
 * Returns `true` if the given node is a directory
 *
 * @param treeNode - A tree node
 */
export declare function isDir<T>(treeNode: FileTreeNode<T>): treeNode is Dir<T>;
export declare type FileTreeNode<Meta = {}> = File<Meta> | Dir<Meta>;
export declare type FileTreeData<Meta = {}> = {
  name: string;
  meta?: Meta;
};
export declare type FileTreeFactory<Meta = {}> = {
  /**
   * Create a file node that can be inserted into the tree.
   *
   * @param data - The data to create a file with
   */
  createFile(data: FileTreeData<Meta>): File<Meta>;
  /**
   * Create a directory node that can be inserted into the tree.
   *
   * @param data - The data to create a directory with
   * @param expanded - Should the directory be expanded by default?
   */
  createDir(data: FileTreeData<Meta>, expanded?: boolean): Dir<Meta>;
};
export declare type GetNodes<Meta> = {
  /**
   * Get the nodes for a given directory
   *
   * @param parent - The parent directory to get the nodes for
   * @param factory - A factory to create nodes (file/dir) with
   */
  (parent: Dir<Meta>, factory: FileTreeFactory<Meta>):
    | Promise<FileTreeNode<Meta>[]>
    | FileTreeNode<Meta>[];
};
export declare type FileTreeConfig<Meta> = {
  /**
   * A function that compares two nodes for sorting.
   */
  comparator?: FileTree["comparator"];
  /**
   * The root node data
   */
  root?: Omit<FileTreeData<Meta>, "type">;
  /**
   * Restore the tree from a snapshot
   */
  restoreFromSnapshot?: FileTreeSnapshot;
};
