import { Branch } from "./tree/branch";
import { Leaf } from "./tree/leaf";
import { Tree } from "./tree/tree";
export declare function createFileTree<Meta = {}>(getNodes: (parent: Dir<Meta>, factory: FileTreeFactory<Meta>) => FileTreeNode<Meta>[], { root, }?: {
    root?: Omit<FileTreeData<Meta>, "type">;
}): FileTree<Meta>;
export declare class FileTree<Meta = {}> extends Tree<FileTreeData<Meta>> {
    protected rootBranch: Dir<Meta>;
    protected treeNodeMap: Map<number, File<Meta> | Dir<Meta>>;
    getById: (id: number) => FileTreeNode<Meta> | undefined;
    get root(): Dir<Meta>;
    produce(dir: Dir<Meta>, produceFn: (context: FileTreeFactory<Meta> & {
        get draft(): FileTreeNode<Meta>[];
        insert<NodeType extends FileTreeNode<Meta>>(node: NodeType, insertionIndex?: number): NodeType;
        revert(): void;
    }) => void | (Dir<Meta> | File<Meta>)[]): void;
}
export declare class File<Meta = {}> extends Leaf<FileTreeData<Meta>> {
    nodes?: FileTreeNode<Meta>[];
    parent: Dir<Meta> | null;
    get basename(): string;
    get path(): string;
}
export declare class Dir<Meta = {}> extends Branch<FileTreeData<Meta>> {
    nodes?: FileTreeNode<Meta>[];
    parent: Dir<Meta> | null;
    get basename(): string;
    get path(): string;
}
/**
 * A sort comparator for sorting path names
 *
 * @param a - A tree node
 * @param b - A tree node to compare against `a`
 */
export declare function comparator(a: FileTreeNode, b: FileTreeNode): number;
export declare function isFile<T>(treeNode: FileTreeNode): treeNode is File<T>;
export declare function isDir<T>(treeNode: FileTreeNode): treeNode is Dir<T>;
export declare type FileTreeNode<Meta = {}> = File<Meta> | Dir<Meta>;
export declare type FileTreeData<Meta = {}> = {
    name: string;
    meta?: Meta;
};
export declare type FileTreeFactory<Meta = {}> = {
    createFile(data: FileTreeData<Meta>): File<Meta>;
    createDir(data: FileTreeData<Meta>, expanded?: boolean): Dir<Meta>;
};
