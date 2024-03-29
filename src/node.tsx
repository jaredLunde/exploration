import * as React from "react";
import { isDir, isFile } from "./file-tree";
import type { FileTree, FileTreeNode } from "./file-tree";
import { subject } from "./tree/subject";
import type { NodePlugin } from "./use-node-plugins";
import { useNodePlugins } from "./use-node-plugins";
import { retryWithBackoff } from "./utils";

/**
 * A React component that renders a node in a file tree with plugins. The
 * `<Node>` component uses this under the hood.
 *
 * @param props - Node props
 */
export function Node<Meta>(props: NodeProps<Meta>) {
  const elementProps = useNodePlugins(props.node.id, [
    ...(props.plugins ?? empty),
    useNode(props.tree, props),
  ]);

  return React.createElement(props.as ?? "div", elementProps, props.children);
}

/**
 * A plugin that creates and memoizes node-specific props.
 *
 * @param fileTree - A file tree
 * @param config - Props to generate exploration node-specific props from
 */
export function useNode<Meta>(
  fileTree: FileTree<Meta>,
  config: UseNodeConfig<Meta>
) {
  const { node, index, style } = config;
  const type = isDir(node) ? "dir" : isFile(node) ? "file" : "prompt";
  const expanded = isDir(node) ? node.expanded : undefined;
  const { id, depth } = node;
  const props = React.useMemo<React.HTMLAttributes<HTMLElement>>(() => {
    return {
      role: "button",
      style,
      "data-exploration-id": id,
      "data-exploration-index": index,
      "data-exploration-depth": depth,
      "data-exploration-type": type,
      "data-exploration-expanded": expanded,
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
          if (expanded) {
            fileTree.collapse(node);
          } else {
            retryWithBackoff(() => fileTree.expand(node), {
              shouldRetry() {
                return node.expanded && !fileTree.isExpanded(node);
              },
            }).catch(() => {});
          }
        }
      },
    };
  }, [index, depth, expanded, style, type, node, fileTree, id]);

  return {
    didChange: noopSubject,
    getProps() {
      return props;
    },
  };
}

const empty: [] = [];
const noopSubject = subject(0);

export interface NodeProps<Meta> {
  /**
   * Render the node as this component
   *
   * @default "div"
   */
  as?: React.ComponentType<React.HTMLAttributes<HTMLElement>>;
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

export type UseNodeConfig<Meta> = Pick<
  NodeProps<Meta>,
  "node" | "index" | "style"
>;
