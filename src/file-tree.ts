import { pathFx } from ".";
import { Branch } from "./tree/branch";
import { Leaf } from "./tree/leaf";
import { isBranch, Tree } from "./tree/tree";
import type { Node } from "./tree/types";

export function createFileTree<Meta = {}>(
  getNodes: (parent: FileTreeData<Meta>) => FileTreeData<Meta>[],
  {
    root,
  }: {
    root?: {
      path: string;
      meta?: Meta;
    };
  } = {}
) {
  return new FileTree<Meta>(
    {
      getNodes: (parent, source) => {
        return getNodes(parent.data).map((data) => {
          if (data.type === Fs.Dir) {
            return source.createBranch(data);
          }

          return source.createLeaf(data);
        });
      },
    },
    root ? { ...root, type: Fs.Dir } : { path: "/", type: Fs.Dir }
  );
}

export class FileTree<Meta = {}> extends Tree<FileTreeData<Meta>> {
  protected declare rootBranch: Dir<Meta>;

  get root(): Dir<Meta> {
    return this.rootBranch;
  }

  protected getNodeFactory(
    branch: Dir<Meta> | null
  ): FileTreeNodeFactory<Meta> {
    return {
      createBranch: (data: FileTreeData<Meta>, expanded?: boolean): Dir<Meta> =>
        new Dir(this.nextId(), branch, data, expanded),
      createLeaf: (data: FileTreeData<Meta>): File<Meta> =>
        new File(this.nextId(), branch, data),
    };
  }
}

export class File<Meta = {}> extends Leaf<FileTreeData<Meta>> {
  public declare nodes?: FileTreeNode<Meta>[];
  public declare parent: Dir<Meta> | null;

  get basename() {
    return pathFx.basename(this.data.path);
  }

  get path() {
    if (this.parent) {
      return pathFx.join(this.parent.data.path, this.basename);
    }

    return this.data.path;
  }
}

export class Dir<Meta = {}> extends Branch<FileTreeData<Meta>> {
  public declare nodes?: FileTreeNode<Meta>[];
  public declare parent: Dir<Meta> | null;

  get basename() {
    return pathFx.basename(this.data.path);
  }

  get path() {
    if (this.parent) {
      return pathFx.join(this.parent.data.path, this.basename);
    }

    return this.data.path;
  }
}

/**
 * A sort comparator for sorting path names
 *
 * @param a - A tree node
 * @param b - A tree node to compare against `a`
 */
export function comparator(a: Node<FileTreeData>, b: Node<FileTreeData>) {
  if (a.constructor === b.constructor) {
    return a.data.path.localeCompare(b.data.path);
  }

  return isBranch(a) ? -1 : isBranch(b) ? 1 : 0;
}

export function isFile<T>(treeNode: Node<T>): treeNode is Leaf<T> {
  return treeNode.constructor === Leaf;
}

export function isDir<T>(treeNode: Node<T>): treeNode is Leaf<T> {
  return treeNode.constructor === Branch;
}

export type FileTreeNode<Meta = {}> = File<Meta> | Dir<Meta>;

export type FileTreeData<Meta = {}> = {
  path: string;
  type: Fs;
  meta?: Meta;
};

export enum Fs {
  File = 1,
  Dir = 2,
}

export type FileTreeNodeFactory<Meta = {}> = {
  createBranch: (
    data: FileTreeData<Meta>,
    expanded?: boolean
  ) => Branch<FileTreeData<Meta>>;
  createLeaf: (data: FileTreeData<Meta>) => Leaf<FileTreeData<Meta>>;
};
