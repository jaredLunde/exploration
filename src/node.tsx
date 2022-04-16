import * as React from "react";
import trieMemoize from "trie-memoize";
import { isDir } from "./file-tree";
import type { FileTree, FileTreeNode } from "./file-tree";
import { observable } from "./tree/observable";
import type { NodePlugin } from "./use-node-plugins";
import { useNodePlugins } from "./use-node-plugins";

/**
 * A React component that renders a node in a file tree with plugins.
 *
 * @param props - Node props
 */
export function Node<Meta>(props: NodeProps<Meta>) {
  const elementProps = useNodePlugins(props.node.id, [
    ...(props.plugins ?? empty),
    {
      didChange: noopObservable,
      getProps() {
        return createProps(
          props.tree,
          props.node,
          props.style,
          props.node.depth,
          props.index
        );
      },
    },
  ]);

  return React.createElement("div", elementProps, props.children);
}

const empty: [] = [];

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
    role: "button",
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
