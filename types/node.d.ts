import * as React from "react";
import type { FileTree, FileTreeNode } from "./file-tree";
import type { NodePlugin } from "./use-node-plugins";
/**
 * A React component that renders a node in a file tree with plugins. The
 * `<Node>` component uses this under the hood.
 *
 * @param props - Node props
 */
export declare function Node<Meta>(props: NodeProps<Meta>): React.DetailedReactHTMLElement<React.HTMLAttributes<HTMLElement>, HTMLElement>;
export interface NodeProps<Meta> {
    /**
     *  A file tree node
     */
    node: FileTreeNode<Meta>;
    /**
     * The index of the node within the file tree list of visible nodes
     */
    index: number;
    /**
     * The file tree that contains the node
     */
    tree: FileTree<Meta>;
    /**
     * A list of plugins to apply to the node. For example `useTraits()`.
     */
    plugins?: NodePlugin[];
    /**
     * Styles to apply to the `<div>` element
     */
    style: React.CSSProperties;
    /**
     * Children to render within the node
     */
    children: React.ReactNode;
}
