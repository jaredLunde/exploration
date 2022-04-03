import { Tree } from "./tree/tree";
import type { TreeNode } from "./tree/types";

export function createFileTree<Meta>(
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
  return new Tree<FileTreeData<Meta>>(
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

/**
 * A sort comparator for sorting path names
 *
 * @param a - A tree node
 * @param b - A tree node to compare against `a`
 */
export function comparator(
  a: TreeNode<FileTreeData>,
  b: TreeNode<FileTreeData>
) {
  if (a.constructor === b.constructor) {
    return a.data.path.localeCompare(b.data.path);
  }

  return Tree.isBranch(a) ? -1 : Tree.isBranch(b) ? 1 : 0;
}

export type FileTreeData<Meta = {}> = {
  path: string;
  type: Fs;
  meta?: Meta;
};

export enum Fs {
  File = 1,
  Dir = 2,
}
