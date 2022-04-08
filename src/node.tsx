import * as React from "react";
import { isDir } from "./file-tree";
import type { FileTree, FileTreeNode } from "./file-tree";
import type { NodePlugin } from "./use-node-props";
import { useNodeProps } from "./use-node-props";
import { mergeProps } from "./utils";

export function Node<Meta>({ tree, node, plugins, ...props }: NodeProps<Meta>) {
  const nodeProps = useNodeProps(node.id, plugins);

  return React.createElement(
    "div",
    mergeProps<React.HTMLAttributes<HTMLDivElement>[]>(nodeProps, props, {
      onClick(event) {
        if (event.metaKey || event.shiftKey || event.altKey || event.ctrlKey) {
          return;
        }

        if (isDir(node)) {
          if (tree.isExpanded(node)) {
            tree.collapse(node);
          } else {
            tree.expand(node);
          }
        }
      },
      className: `depth-${node.depth}`,
    })
  );
}

export interface NodeProps<Meta> extends React.HTMLAttributes<HTMLDivElement> {
  node: FileTreeNode<Meta>;
  tree: FileTree<Meta>;
  plugins: NodePlugin[];
  children: React.ReactNode;
}
