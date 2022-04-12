import * as React from "react";
import trieMemoize from "trie-memoize";
import { isDir } from "./file-tree";
import type { FileTree, FileTreeNode } from "./file-tree";
import { observable } from "./tree/observable";
import type { NodePlugin } from "./use-node-props";
import { useNodeProps } from "./use-node-props";

export function Node<Meta>({
  tree,
  node,
  index,
  plugins,
  style,
  children,
}: NodeProps<Meta>) {
  const nodeProps = useNodeProps(node.id, [
    ...plugins,
    {
      didChange: noopObservable,
      getProps() {
        return createProps(tree, node, style, node.depth, index);
      },
    },
  ]);

  return React.createElement("div", nodeProps, children);
}

const createProps = trieMemoize(
  [WeakMap, WeakMap, WeakMap, Map, Map],
  <Meta,>(
    tree: FileTree<Meta>,
    node: FileTreeNode<Meta>,
    style: React.CSSProperties,
    depth: number,
    index: number
  ): React.HTMLAttributes<HTMLDivElement> => ({
    id: `exp-${index}`,
    style,
    className: `depth-${depth}`,
    onClick(event) {
      event.currentTarget.focus();

      if (
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.ctrlKey ||
        event.button === 2
      ) {
        return;
      }

      if (isDir(node)) {
        if (node.expanded) {
          tree.collapse(node);
        } else {
          tree.expand(node);
        }
      }
    },
  })
);

const noopObservable = observable(0);

export interface NodeProps<Meta> {
  node: FileTreeNode<Meta>;
  index: number;
  tree: FileTree<Meta>;
  plugins: NodePlugin[];
  style: React.CSSProperties;
  children: React.ReactNode;
}
