import * as pathFx from "./path-fx";
import { Branch } from "./tree/branch";
import { Leaf } from "./tree/leaf";
import { nodesById } from "./tree/nodes-by-id";
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
export function createFileTree<Meta = {}>(
  getNodes: GetNodes<Meta>,
  config: FileTreeConfig<Meta> = {}
) {
  const { comparator = defaultComparator, root, restoreFromSnapshot } = config;

  const tree = new FileTree<Meta>({
    async getNodes(parent) {
      const factory: Omit<FileTreeFactory<Meta>, "createPrompt"> = {
        createFile(data) {
          return new File(parent, data);
        },

        createDir(data, expanded?: boolean) {
          const path =
            parent.id === -1
              ? data.name
              : pathFx.join(
                  // @ts-expect-error: branch type but is dir
                  parent.path,
                  pathFx.basename(data.name)
                );

          return new Dir(
            parent,
            data,
            expanded ??
              !!(
                restoreFromSnapshot &&
                (restoreFromSnapshot.expandedPaths.includes(path) ||
                  restoreFromSnapshot.buriedPaths.includes(path))
              )
          );
        },
      };

      return getNodes(parent as Dir<Meta>, factory);
    },
    comparator,
    root: new Dir(null, root ? { ...root } : { name: pathFx.SEP }),
  });

  return tree;
}

export class FileTree<Meta = {}> extends Tree<FileTreeData<Meta>> {
  /**
   * The root directory of the file tree
   */
  declare root: Dir<Meta>;
  protected declare treeNodeMap: Map<number, File<Meta> | Dir<Meta>>;
  declare nodesById: FileTreeNode<Meta>[];
  protected declare loadingBranches: Map<Dir<Meta>, Promise<void>>;

  /**
   * Get a node by its ID.
   *
   * @param id - The ID of the node
   */
  declare getById: (id: number) => FileTreeNode<Meta> | undefined;
  /**
   * Expand a directory in the tree.
   *
   * @param dir - The directory to expand
   * @param options - Options for expanding the directory
   */
  declare expand: (
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
  declare collapse: (dir: Dir<Meta>) => void;
  /**
   * Remove a node and its descendants from the tree.
   */
  declare remove: (node: FileTreeNode<Meta>) => void;
  /**
   * You can use this method to manually trigger a reload of a directory in the tree.
   *
   * @param dir - The branch to load nodes for
   */
  declare loadNodes: (dir: Dir<Meta>) => Promise<void>;

  constructor({
    getNodes,
    comparator,
    root,
  }: {
    getNodes: GetNodesBase<FileTreeData<Meta>>;
    comparator: (a: FileTreeNode<Meta>, b: FileTreeNode<Meta>) => number;
    root: Dir<Meta>;
  }) {
    super({ getNodes, root });
    // @ts-expect-error
    this.comparator = comparator;
  }

  /**
   * Get a node in the tree by its path. Note that this requires walking the tree,
   * which has O(n) complexity. It should therefore be avoided unless absolutely necessary.
   *
   * @param path - The path to search for in the tree
   */
  getByPath(path: string) {
    let found: FileTreeNode<Meta> | undefined;
    path = pathFx.removeTrailingSlashes(pathFx.normalize(path));

    this.walk(this.root, (node) => {
      if (node.path === path) {
        found = node;
        return false;
      }
    });

    return found;
  }

  /**
   * A function that walks the tree starting at a given directory and calls a visitor
   * function for each node.
   *
   * @param dir - The directory to walk
   * @param visitor - A function that is called for each node in the tree. Returning
   *   `false` will stop the walk.
   * @example
   * tree.walk(tree.root, node => {
   *   console.log(node.path);
   *
   *   if (node.path === '/foo/bar') {
   *     return false
   *   }
   * })
   */
  walk(
    dir: Dir<Meta>,
    visitor: (
      node: FileTreeNode<Meta>,
      parent: FileTreeNode<Meta>
    ) => boolean | void
  ) {
    const nodeIds = !dir.nodes ? [] : [...dir.nodes];
    let nodeId: number | undefined;

    while ((nodeId = nodeIds.pop())) {
      const node = this.getById(nodeId);
      if (!node) continue;

      const shouldContinue = visitor(node, dir);
      if (shouldContinue === false) return;

      if (isDir(node) && node.nodes) {
        nodeIds.push(...node.nodes);
      }
    }
  }

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
  ) {
    return this._produce(dir, (context) => {
      const producer = produceFn({
        get draft() {
          return context.draft as (Dir<Meta> | File<Meta>)[];
        },

        insert(node) {
          const insertedNode = context.insert(node, 0);
          return insertedNode;
        },

        revert() {
          context.revert();
        },

        createFile(data) {
          return new File(dir, data);
        },

        createDir(data, expanded?: boolean) {
          return new Dir(dir, data, expanded);
        },

        createPrompt() {
          return new Prompt(dir, { name: "" });
        },
      });

      return producer;
    });
  }

  /**
   * Move a node to a new parent.
   *
   * @param node - The node to move
   * @param to - The new parent
   */
  move(node: File<Meta> | Dir<Meta>, to: Dir<Meta>) {
    return super.move(node, to);
  }

  /**
   * Create a new file in a given directory.
   *
   * @param inDir - The directory to create the file in
   * @param withData - The data for the file
   */
  newFile(inDir: Dir<Meta>, withData: FileTreeData<Meta>) {
    const file = new File(inDir, withData);

    this.produce(inDir, ({ insert }) => {
      insert(file);
    });

    return file;
  }

  /**
   * Create a new directory in a given directory.
   *
   * @param inDir - The directory to create the directory in
   * @param withData - The data for the directory
   * @param expanded - Whether the directory should be expanded by default
   */
  newDir(inDir: Dir<Meta>, withData: FileTreeData<Meta>, expanded?: boolean) {
    const dir = new Dir(inDir, withData, expanded);

    this.produce(inDir, ({ insert }) => {
      insert(dir);
    });

    return dir;
  }

  /**
   * Create a new directory in a given directory.
   *
   * @param inDir - The directory to create the directory in
   */
  newPrompt(inDir: Dir<Meta>) {
    const prompt = new Prompt(inDir, { name: "" });

    this.produce(inDir, ({ insert }) => {
      insert(prompt);
    });

    return prompt;
  }

  /**
   * Rename a node.
   *
   * @param node - The node to rename
   * @param newName - The new name for the node
   */
  rename(node: File<Meta> | Dir<Meta>, newName: string) {
    node.data.name = newName;
    const parent = node.parent;

    if (parent && parent.nodes) {
      this.setNodes(parent, [...parent.nodes]);
    }
  }
}

export class File<Meta = {}> extends Leaf<FileTreeData<Meta>> {
  readonly $$type = "file";
  private _basenameName?: string;
  private _basename?: string;

  /**
   * The parent directory of the file
   */
  get parent(): Dir<Meta> | null {
    return this.parentId === -1
      ? null
      : (nodesById[this.parentId] as Dir<Meta>);
  }

  /**
   * The basename of the file
   */
  get basename() {
    if (this._basenameName === this.data.name) {
      return this._basename!;
    }

    this._basenameName = this.data.name;
    return (this._basename = pathFx.basename(this.data.name));
  }

  /**
   * The full path of the file
   */
  get path(): string {
    return getPath(this);
  }
}

export class Dir<Meta = {}> extends Branch<FileTreeData<Meta>> {
  readonly $$type = "dir";
  private _basenameName?: string;
  private _basename?: string;

  /**
   * The parent directory of this directory
   */
  get parent(): Dir<Meta> | null {
    return this.parentId === -1
      ? null
      : (nodesById[this.parentId] as Dir<Meta>);
  }

  /**
   * The basename of the directory
   */
  get basename() {
    if (this._basenameName === this.data.name) {
      return this._basename!;
    }

    this._basenameName = this.data.name;
    return (this._basename = pathFx.basename(this.data.name));
  }

  /**
   * The full path of the directory
   */
  get path(): string {
    return getPath(this);
  }
}

export class Prompt<Meta = {}> extends Leaf<FileTreeData<Meta>> {
  readonly $$type = "prompt";
  /**
   * The parent directory of this directory
   */
  get parent(): Dir<Meta> | null {
    return this.parentId === -1
      ? null
      : (nodesById[this.parentId] as Dir<Meta>);
  }

  get basename() {
    return "";
  }

  /**
   * The full path of the prompt
   */
  get path(): string {
    return getPath(this);
  }
}

function getPath(node: FileTreeNode) {
  if (node.parent) {
    const parentPath = node.parent.path;
    const hasTrailingSlash = parentPath[parentPath.length - 1] === pathFx.SEP;
    const sep =
      hasTrailingSlash || parentPath === "" || node.basename === ""
        ? ""
        : pathFx.SEP;
    return parentPath + sep + node.basename;
  }

  return pathFx.normalize(node.data.name);
}

/**
 * A sort comparator for sorting path names
 *
 * @param a - A tree node
 * @param b - A tree node to compare against `a`
 */
export function defaultComparator(a: FileTreeNode, b: FileTreeNode) {
  if (a.constructor === b.constructor) {
    return a.basename.localeCompare(b.basename);
  }

  if (isPrompt(a)) {
    return -1;
  } else if (isPrompt(b)) {
    return 1;
  } else if (isDir(a)) {
    return -1;
  } else if (isDir(b)) {
    return 1;
  }

  return 0;
}

/**
 * Returns `true` if the given node is a prompt
 *
 * @param treeNode - A tree node
 */
export function isPrompt<Meta>(
  treeNode: FileTreeNode<Meta>
): treeNode is Prompt<Meta> {
  return treeNode.constructor === Prompt;
}

/**
 * Returns `true` if the given node is a file
 *
 * @param treeNode - A tree node
 */
export function isFile<Meta>(
  treeNode: FileTreeNode<Meta>
): treeNode is File<Meta> {
  return treeNode.constructor === File;
}

/**
 * Returns `true` if the given node is a directory
 *
 * @param treeNode - A tree node
 */
export function isDir<Meta>(
  treeNode: FileTreeNode<Meta>
): treeNode is Dir<Meta> {
  return treeNode.constructor === Dir;
}

export type FileTreeNode<Meta = {}> = File<Meta> | Dir<Meta> | Prompt<Meta>;

export type FileTreeData<Meta = {}> = {
  name: string;
  meta?: Meta;
};

export type FileTreeFactory<Meta = {}> = {
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
  /**
   * Create a prompt node that can be inserted into the tree.
   */
  createPrompt(): Prompt<Meta>;
};

export type GetNodes<Meta> = {
  /**
   * Get the nodes for a given directory
   *
   * @param parent - The parent directory to get the nodes for
   * @param factory - A factory to create nodes (file/dir) with
   */
  (parent: Dir<Meta>, factory: Omit<FileTreeFactory<Meta>, "createPrompt">):
    | Promise<FileTreeNode<Meta>[]>
    | FileTreeNode<Meta>[];
};

export type FileTreeConfig<Meta> = {
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
