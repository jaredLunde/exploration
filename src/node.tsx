import * as React from "react";
import { isDir } from "./file-tree";
import type { FileTree, FileTreeNode } from "./file-tree";
import { subject } from "./tree/subject";
import type { NodePlugin } from "./use-node-plugins";
import { useNodePlugins } from "./use-node-plugins";

/**
 * A React component that renders a node in a file tree with plugins. The
 * `<Node>` component uses this under the hood.
 *
 * @param props - Node props
 */
export function Node<Meta>(props: NodeProps<Meta>) {
  const nodeProps = useNodeProps(props);

  const elementProps = useNodePlugins(props.node.id, [
    ...(props.plugins ?? empty),
    {
      didChange: noopSubject,
      getProps() {
        return nodeProps;
      },
    },
  ]);

  return React.createElement(props.as ?? "div", elementProps, props.children);
}

/**
 * A hook that creates and memoizes node-specific props from a set of input props.
 *
 * @param config - Props to generate exploration node-specific props from
 */
export function useNodeProps<Meta>(config: Omit<NodeProps<Meta>, "as">) {
  return React.useMemo<React.HTMLAttributes<HTMLElement>>(() => {
    const node = config.node;
    const dir = isDir(node);

    return {
      role: "button",
      style: config.style,
      "data-exploration-id": node.id,
      "data-exploration-index": config.index,
      "data-exploration-depth": node.depth,
      "data-exploration-expanded": dir ? node.expanded : undefined,
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

        if (dir) {
          if (node.expanded) {
            config.tree.collapse(node);
          } else {
            config.tree.expand(node);
          }
        }
      },
    };
  }, [config.index, config.style, config.tree, config.node]);
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
