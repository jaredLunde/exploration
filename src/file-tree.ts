import { pathFx } from ".";
import { Branch } from "./tree/branch";
import { Leaf } from "./tree/leaf";
import { Tree } from "./tree/tree";

export function createFileTree<Meta = {}>(
  getNodes: (
    parent: Dir<Meta>,
    factory: FileTreeFactory<Meta>
  ) => FileTreeNode<Meta>[],
  {
    root,
  }: {
    root?: Omit<FileTreeData<Meta>, "type">;
  } = {}
) {
  return new FileTree<Meta>({
    getNodes: (parent) => {
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
    root: new Dir(null, root ? { ...root } : { name: "/" }),
  });
}

export class FileTree<Meta = {}> extends Tree<FileTreeData<Meta>> {
  protected declare rootBranch: Dir<Meta>;
  protected declare treeNodeMap: Map<number, File<Meta> | Dir<Meta>>;
  declare getById: (id: number) => FileTreeNode<Meta> | undefined;

  get root(): Dir<Meta> {
    return this.rootBranch;
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
    return super._produce(dir, (context) =>
      produceFn({
        get draft() {
          return context.draft as (Dir<Meta> | File<Meta>)[];
        },
        insert(node, insertionIndex) {
          return context.insert(node, insertionIndex);
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
      })
    );
  }
}

export class File<Meta = {}> extends Leaf<FileTreeData<Meta>> {
  public declare nodes?: FileTreeNode<Meta>[];
  public declare parent: Dir<Meta> | null;

  get basename() {
    return pathFx.basename(this.data.name);
  }

  get path() {
    if (this.parent) {
      return pathFx.join(this.parent.data.name, this.basename);
    }

    return this.data.name;
  }
}

export class Dir<Meta = {}> extends Branch<FileTreeData<Meta>> {
  public declare nodes?: FileTreeNode<Meta>[];
  public declare parent: Dir<Meta> | null;

  get basename() {
    return pathFx.basename(this.data.name);
  }

  get path() {
    if (this.parent) {
      return pathFx.join(this.parent.data.name, this.basename);
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
export function comparator(a: FileTreeNode, b: FileTreeNode) {
  if (a.constructor === b.constructor) {
    return a.data.name.localeCompare(b.data.name);
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
