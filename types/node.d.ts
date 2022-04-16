import * as React from "react";
import type { FileTree, FileTreeNode } from "./file-tree";
import type { NodePlugin } from "./use-node-plugins";
export declare function Node<Meta>({
  tree,
  node,
  index,
  plugins,
  style,
  children,
}: NodeProps<Meta>): React.DetailedReactHTMLElement<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
>;
export interface NodeProps<Meta> {
  node: FileTreeNode<Meta>;
  index: number;
  tree: FileTree<Meta>;
  plugins?: NodePlugin[];
  style: React.CSSProperties;
  children: React.ReactNode;
}
