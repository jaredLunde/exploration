import * as pathFx from "./path-fx";
import { Branch } from "./tree/branch";
import { Leaf } from "./tree/leaf";
import { nodesById } from "./tree/nodes-by-id";
import type { GetNodes } from "./tree/tree";
import { Tree } from "./tree/tree";

export function createFileTree<Meta = {}>(
  getNodes: (
    parent: Dir<Meta>,
    factory: FileTreeFactory<Meta>
  ) => Promise<FileTreeNode<Meta>[]> | FileTreeNode<Meta>[],
  config: {
    comparator?: FileTree["comparator"];
    root?: Omit<FileTreeData<Meta>, "type">;
  } = {}
) {
  const { comparator = defaultComparator, root } = config;

  return new FileTree<Meta>({
    async getNodes(parent) {
      const factory: FileTreeFactory<Meta> = {
        createFile(data) {
          return new File(parent, data);
        },

        createDir(data, expanded?: boolean) {
          return new Dir(parent, data, expanded);
        },
      };

      return getNodes(parent as Dir<Meta>, factory);
    },
    comparator,
    root: new Dir(null, root ? { ...root } : { name: "/" }),
  });
}

export class FileTree<Meta = {}> extends Tree<FileTreeData<Meta>> {
  declare root: Dir<Meta>;
  protected declare treeNodeMap: Map<number, File<Meta> | Dir<Meta>>;
  declare nodesById: FileTreeNode<Meta>[];
  declare getById: (id: number) => FileTreeNode<Meta> | undefined;
  declare expand: (
    dir: Dir<Meta>,
    options?: {
      ensureVisible?: boolean;
      recursive?: boolean;
    }
  ) => Promise<void>;
  declare collapse: (dir: Dir<Meta>) => void;
  declare remove: (node: FileTreeNode<Meta>) => void;

  constructor({
    getNodes,
    comparator,
    root,
  }: {
    getNodes: GetNodes<FileTreeData<Meta>>;
    comparator: (a: FileTreeNode<Meta>, b: FileTreeNode<Meta>) => number;
    root: Dir<Meta>;
  }) {
    super({ getNodes, root });
    // @ts-expect-error
    this.comparator = comparator;
  }

  public produce(
    dir: Dir<Meta>,
    produceFn: (
      context: FileTreeFactory<Meta> & {
        get draft(): FileTreeNode<Meta>[];
        insert<NodeType extends FileTreeNode<Meta>>(
          node: NodeType,
          insertionIndex?: number
        ): NodeType;
        revert(): void;
      }
    ) => void | (Dir<Meta> | File<Meta>)[]
  ) {
    return this._produce(dir, (context) => {
      const producer = produceFn({
        get draft() {
          return context.draft as (Dir<Meta> | File<Meta>)[];
        },

        insert(node, insertionIndex) {
          const insertedNode = context.insert(node, insertionIndex);
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
      });

      return producer;
    });
  }

  move(node: FileTreeNode<Meta>, to: Dir<Meta>) {
    return super.move(node, to);
  }

  newFile(inDir: Dir<Meta>, withData: FileTreeData<Meta>) {
    this.produce(inDir, ({ createFile, insert }) => {
      insert(createFile(withData));
    });
  }

  newDir(inDir: Dir<Meta>, withData: FileTreeData<Meta>, expanded?: boolean) {
    this.produce(inDir, ({ createDir, insert }) => {
      insert(createDir(withData, expanded));
    });
  }

  rename(node: FileTreeNode<Meta>, newName: string) {
    node.data.name = newName;
    const parent = node.parent;

    if (parent && parent.nodes) {
      this.setNodes(
        parent,
        parent.nodes.map((id) => this.getById(id)!)
      );
    }
  }
}

export class File<Meta = {}> extends Leaf<FileTreeData<Meta>> {
  get parent(): Dir<Meta> | null {
    return this.parentId === -1
      ? null
      : (nodesById[this.parentId] as Dir<Meta>);
  }

  get basename() {
    return pathFx.basename(this.data.name);
  }

  get path() {
    if (this.parentId > -1) {
      return pathFx.join(this.parent!.data.name, this.basename);
    }

    return this.data.name;
  }
}

export class Dir<Meta = {}> extends Branch<FileTreeData<Meta>> {
  get parent(): Dir<Meta> | null {
    return this.parentId === -1
      ? null
      : (nodesById[this.parentId] as Dir<Meta>);
  }

  get basename() {
    return pathFx.basename(this.data.name);
  }

  get path() {
    if (this.parentId > -1) {
      return pathFx.join(this.parent!.data.name, this.basename);
    }

    return this.data.name;
  }
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

  return isDir(a) ? -1 : isDir(b) ? 1 : 0;
}

export function isFile<T>(treeNode: FileTreeNode): treeNode is File<T> {
  return treeNode.constructor === File;
}

export function isDir<T>(treeNode: FileTreeNode): treeNode is Dir<T> {
  return treeNode.constructor === Dir;
}

export type FileTreeNode<Meta = {}> = File<Meta> | Dir<Meta>;

export type FileTreeData<Meta = {}> = {
  name: string;
  meta?: Meta;
};

export type FileTreeFactory<Meta = {}> = {
  createFile(data: FileTreeData<Meta>): File<Meta>;
  createDir(data: FileTreeData<Meta>, expanded?: boolean): Dir<Meta>;
};
