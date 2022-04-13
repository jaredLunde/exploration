import * as React from "react";
import type { FileTree, FileTreeNode } from "./file-tree";
import type { WindowRef } from "./types";
export declare function useVirtualize<Meta>(
  fileTree: FileTree<Meta>,
  { windowRef, nodes, nodeHeight, nodeGap, overscanBy }: UseVirtualizeOptions
): {
  scrollTop: number;
  isScrolling: boolean;
  scrollToNode: (nodeId: number, config?: ScrollToNodeConfig) => void;
  props: {
    tabIndex: number;
    style: React.CSSProperties;
  };
  map(
    render: (config: VirtualizeRenderProps<Meta>) => React.ReactElement
  ): React.ReactElement<any, string | React.JSXElementConstructor<any>>[];
};
export declare function useHeight(windowRef: WindowRef): number;
export declare function useGlobalWindowHeight(
  windowRef: WindowRef
): number | null;
export declare function useScrollPosition(
  windowRef: WindowRef,
  { offset }?: UseScrollPosition
): {
  scrollTop: number;
  isScrolling: boolean;
};
export interface UseScrollPosition {
  offset?: number;
}
export interface UseVirtualizeOptions {
  nodes?: number[];
  nodeHeight: number;
  nodeGap?: number;
  overscanBy?: number;
  windowRef: WindowRef;
}
export declare type ScrollToNodeConfig = {
  behavior?: "smooth" | "auto";
  align?: "auto" | "smart" | "center" | "start" | "end";
};
export interface VirtualizeRenderProps<Meta> {
  key: number;
  index: number;
  node: FileTreeNode<Meta>;
  tree: FileTree<Meta>;
  style: React.CSSProperties;
}
