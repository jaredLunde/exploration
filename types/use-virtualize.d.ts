import * as React from "react";
import type { FileTree, FileTreeNode } from "./file-tree";
import type { WindowRef } from "./types";
/**
 * A hook similar to `react-window`'s [`FixesSizeList`](https://react-window.vercel.app/#/examples/list/fixed-size)
 * component. It allows you to render only enough components to fill a viewport, solving
 * some important performance bottlenecks when rendering large lists.
 *
 * @param fileTree - The file tree to virtualize.
 * @param config - Configuration options
 */
export declare function useVirtualize<Meta>(
  fileTree: FileTree<Meta>,
  config: UseVirtualizeConfig
): UseVirtualizeResult<Meta>;
export declare function useHeight(
  windowRef: WindowRef,
  ResizeObserver: any
): number;
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
export interface UseVirtualizeConfig {
  /**
   * The fixed height (in px) of each node in your list.
   */
  nodeHeight: number;
  /**
   * Optionally set a gap (in px) between each node in your list.
   */
  nodeGap?: number;
  /**
   * When using a hook like `useFilter` you can supply the filtered list of
   * nodes to this option. By default, `useVirtualize()` uses the nodes returned
   * by `useVisibleNodes()`
   */
  nodes?: number[];
  /**
   * This number is used for determining the number of nodes outside of the visible
   * window to render. The default value is 2 which means "render 2 windows worth (2 * height)
   * of content before and after the items in the visible window". A value of 3 would be
   * 3 windows worth of grid cells, so it's a linear relationship. Overscanning is important
   * for preventing tearing when scrolling through items in the grid, but setting too high of
   * a value may create too much work for React to handle, so it's best that you tune this
   * value accordingly.
   *
   * @default 2
   */
  overscanBy?: number;
  /**
   * A React ref created by useRef() or an HTML element for the container viewport
   * you're rendering the list inside of.
   */
  windowRef: WindowRef;
  /**
   * This hook uses a [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
   * for tracking the size of the viewport. If you need to polyfill ResizeObserver you can provide
   * that polyfill here. By default, we use the `ResizeObserver` from the `window` global.
   */
  ResizeObserver?: ResizeObserver;
}
export declare type ScrollToNodeConfig = {
  /**
   * The scrolling behavior
   */
  behavior?: "smooth" | "auto";
  /**
   * By default, the list will scroll as little as possible to ensure the item is
   * visible. You can control the alignment of the item though by specifying a
   * second alignment parameter.
   * - `auto` - Scroll as little as possible to ensure the item is visible. (If the item
   *     is already visible, it won't scroll at all.)
   * - `smart` - If the item is already visible, don't scroll at all. If it is less than
   *      one viewport away, scroll as little as possible so that it becomes visible. If
   *      it is more than one viewport away, scroll so that it is centered within the list.
   * - `center` - Center align the item within the list.
   * - `end` - Align the item to the end of the list (the bottom for vertical lists or the
   *      right for horizontal lists).
   * - `start` - Align the item to the beginning of the list (the top for vertical lists or
   *      the left for horizontal lists).
   *
   * @default "auto"
   */
  align?: "auto" | "smart" | "center" | "start" | "end";
};
export interface UseVirtualizeResult<Meta> {
  /**
   * The current scroll position of the viewport
   */
  scrollTop: number;
  /**
   * `true` if the viewport is currently scrolling
   */
  isScrolling: boolean;
  /**
   * Scroll to the viewport a given position
   *
   * @param scrollTop - The new scroll position
   * @param config - Configuration options
   */
  scrollTo(
    scrollTop: number,
    config?: Pick<ScrollToNodeConfig, "behavior">
  ): void;
  /**
   * Scroll to a given node by its ID
   *
   * @param nodeId - The node ID to scroll to
   * @param config - Configuration options
   */
  scrollToNode(nodeId: number, config?: ScrollToNodeConfig): void;
  /**
   * Props that should be applied to the container you're mapping your virtualized
   * nodes into.
   *
   * @example
   * ```tsx
   * const windowRef = React.useRef(null)
   * const virtualize = useVirtualize(fileTree, {windowRef, nodeHeight: 24})
   * return (
   *   <div ref={windowRef} className='file-tree'>
   *     <div className='file-tree-container' {...virtualize.props}>
   *      {virtualize.map(props => <Node {...props}/>)}
   *     </div>
   *   </div>
   * )
   * ```
   */
  props: VirtualizeContainerProps;
  /**
   * Calls a defined render function on each node and returns an array that
   * contains the resulting React elements.
   *
   * @param render - A callback that renders a node.
   * @example
   * ```tsx
   * const windowRef = React.useRef(null)
   * const virtualize = useVirtualize(fileTree, {windowRef, nodeHeight: 24})
   * return (
   *   <div ref={windowRef} className='file-tree'>
   *     <div className='file-tree-container' {...virtualize.props}>
   *      {virtualize.map(props => <Node {...props}/>)}
   *     </div>
   *   </div>
   * )
   * ```
   */
  map(
    render: (config: VirtualizeRenderProps<Meta>) => React.ReactElement
  ): React.ReactElement[];
}
export interface VirtualizeRenderProps<Meta> {
  /**
   * A stable key as required by React elements that are included in arrays
   */
  key: number;
  /**
   * The index of the node within the list of visible nodes
   */
  index: number;
  /**
   * A file tree node
   */
  node: FileTreeNode<Meta>;
  /**
   * The file tree that contains the node
   */
  tree: FileTree<Meta>;
  /**
   * Styles that need to be applied to the node element
   */
  style: React.CSSProperties;
}
export interface VirtualizeContainerProps {
  tabIndex: number;
  style: React.CSSProperties;
}
