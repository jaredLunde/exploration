import {
  clearRequestTimeout,
  requestTimeout,
} from "@essentials/request-timeout";
import * as React from "react";
import trieMemoize from "trie-memoize";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { FileTree, FileTreeNode } from "./file-tree";
import type { WindowRef } from "./types";
import { useResizeObserver } from "./use-resize-observer";
import { useTransition } from "./use-transition";
import { useVisibleNodes } from "./use-visible-nodes";
import { throttle } from "./utils";

/**
 * A hook similar to `react-window`'s [`FixesSizeList`](https://react-window.vercel.app/#/examples/list/fixed-size)
 * component. It allows you to render only enough components to fill a viewport, solving
 * some important performance bottlenecks when rendering large lists.
 *
 * @param fileTree - The file tree to virtualize.
 * @param config - Configuration options
 */
export function useVirtualize<Meta>(
  fileTree: FileTree<Meta>,
  config: UseVirtualizeConfig
): UseVirtualizeResult<Meta> {
  const {
    windowRef,
    nodes,
    nodeHeight,
    nodeGap = 0,
    overscanBy = 2,
    ResizeObserver,
  } = config;
  const _visibleNodes = useVisibleNodes(fileTree);
  const visibleNodes = nodes ?? _visibleNodes;
  const scrollPosition = useScrollPosition(windowRef);
  const height = useHeight(windowRef, ResizeObserver);
  const scrollHeight = (nodeHeight + nodeGap) * visibleNodes.length - nodeGap;

  return {
    scrollTop: scrollPosition.scrollTop,
    isScrolling: scrollPosition.isScrolling,

    scrollTo(scrollTop, config = {}) {
      const windowEl =
        windowRef && "current" in windowRef ? windowRef.current : windowRef;

      if (windowEl) {
        windowEl.scrollTo({ top: scrollTop, behavior: config.behavior });
      }
    },

    scrollToNode(nodeId, config = {}) {
      const index = visibleNodes.indexOf(nodeId) ?? -1;

      if (index > -1) {
        // eslint-disable-next-line prefer-const
        let { behavior = "auto", align = "start" } = config;
        const lastNodeOffset = Math.max(
          0,
          visibleNodes.length * nodeHeight - height
        );
        const nodeOffset = index * (nodeHeight + nodeGap);
        const minOffset = Math.max(
          0,
          nodeOffset - (height + (nodeHeight + nodeGap))
        );
        const maxOffset = Math.min(nodeOffset, lastNodeOffset);
        const windowEl =
          windowRef && "current" in windowRef ? windowRef.current : windowRef;
        // use "start" alignment by default
        let top: number = maxOffset;

        if (align === "smart") {
          if (
            scrollPosition.scrollTop >= minOffset - height &&
            scrollPosition.scrollTop <= maxOffset + height
          ) {
            align = "auto";
          } else {
            align = "center";
          }
        }

        if (align === "end") {
          top = minOffset;
        } else if (align === "center") {
          top = Math.round(minOffset + (maxOffset - minOffset) / 2);

          if (top < Math.ceil(height / 2)) {
            top = 0; // near the beginning
          } else if (top > lastNodeOffset + Math.floor(height / 2)) {
            top = lastNodeOffset; // near the end
          }
        } else if (align === "auto") {
          top = maxOffset;

          if (
            scrollPosition.scrollTop >= minOffset &&
            scrollPosition.scrollTop <= maxOffset
          ) {
            top = scrollPosition.scrollTop;
          } else if (scrollPosition.scrollTop < minOffset) {
            top = minOffset;
          }
        }

        if (top !== scrollPosition.scrollTop) {
          windowEl?.scrollTo({ top, behavior });
        }
      }
    },

    props: {
      tabIndex: 0,
      style: {
        position: "relative",
        width: "100%",
        height: Math.max(Math.ceil(scrollHeight), height),
        contain: "strict",
        userSelect: "none",
        pointerEvents: scrollPosition.isScrolling ? "none" : undefined,
      },
    },

    map(render) {
      const totalNodeHeight = nodeHeight + nodeGap;
      const overscan = height * overscanBy;

      let index = Math.floor(
        Math.max(0, scrollPosition.scrollTop - overscan / 2) / totalNodeHeight
      );
      const stopIndex = Math.min(
        visibleNodes.length,
        Math.ceil((scrollPosition.scrollTop + overscan) / totalNodeHeight)
      );
      const start = index;
      const children: React.ReactElement[] = new Array(
        Math.max(stopIndex - index, 0)
      );

      for (; index < stopIndex; index++) {
        const nodeId = visibleNodes[index];
        const node = fileTree.getById(nodeId);
        if (!node) continue;

        children[index - start] = render({
          key: nodeId,
          index,
          node,
          tree: fileTree,
          style: createStyle(nodeHeight, nodeGap * index + index * nodeHeight),
        });
      }

      return children;
    },
  };
}

const createStyle = trieMemoize(
  [Map, Map],
  (height: number, top: number): React.CSSProperties => ({
    position: "absolute",
    width: "100%",
    height,
    contain: "strict",
    userSelect: "none",
    top,
    left: 0,
  })
);

export function useHeight(windowRef: WindowRef, ResizeObserver: any) {
  const [, startTransition] = useTransition();
  const getWindowHeight = () => {
    const windowEl =
      windowRef && "current" in windowRef ? windowRef.current : windowRef;

    if (typeof window !== "undefined" && windowEl instanceof HTMLElement) {
      const computedStyle = getComputedStyle(windowEl);
      return (
        windowEl.clientHeight -
        parseFloat(computedStyle.paddingTop) -
        parseFloat(computedStyle.paddingBottom)
      );
    }

    return 0;
  };
  const [height, setHeight] = React.useState(getWindowHeight);

  useResizeObserver(
    // @ts-expect-error
    typeof window === "undefined" ||
      (typeof window !== "undefined" && windowRef === window)
      ? null
      : windowRef,
    () => {
      startTransition(() => {
        setHeight(getWindowHeight());
      });
    },
    { ResizeObserver }
  );

  return useGlobalWindowHeight(windowRef) ?? height;
}

export function useGlobalWindowHeight(windowRef: WindowRef) {
  return useSyncExternalStore(
    (callback) => {
      callback = throttle(callback, 12, true);
      if (typeof window !== "undefined" && windowRef instanceof Window) {
        window.addEventListener("resize", callback);
        window.addEventListener("orientationchange", callback);

        return () => {
          window.removeEventListener("resize", callback);
          window.removeEventListener("orientationchange", callback);
        };
      }

      return () => {};
    },
    () => {
      if (typeof window !== "undefined" && windowRef === window) {
        return window.innerHeight;
      }

      return null;
    },
    () => {
      if (typeof window !== "undefined" && windowRef === window) {
        return window.innerHeight;
      }

      return null;
    }
  );
}

export function useScrollPosition(
  windowRef: WindowRef,
  { offset = 0 }: UseScrollPosition = {}
): { scrollTop: number; isScrolling: boolean } {
  const [isScrolling, setIsScrolling] = React.useState(false);
  const getSnapshot = () => {
    const current =
      windowRef && "current" in windowRef ? windowRef.current : windowRef;

    if (typeof window !== "undefined") {
      return !current
        ? 0
        : "scrollTop" in current
        ? current.scrollTop
        : current.scrollY;
    }

    return 0;
  };
  const scrollTop = useSyncExternalStore(
    (callback) => {
      const current =
        windowRef && "current" in windowRef ? windowRef.current : windowRef;
      callback = throttle(callback, 15, true);

      if (current) {
        current.addEventListener("scroll", callback);

        return () => {
          window.removeEventListener("scroll", callback);
        };
      }

      return () => {};
    },
    getSnapshot,
    getSnapshot
  );

  React.useEffect(() => {
    let didUnmount = false;

    const to = requestTimeout(() => {
      if (didUnmount) return;
      // This is here to prevent premature bail outs while maintaining high resolution
      // unsets. Without it there will always be a lot of unnecessary DOM writes to style.
      setIsScrolling(false);
    }, 1000 / 8);

    setIsScrolling(true);

    return () => {
      didUnmount = true;
      to && clearRequestTimeout(to);
    };
  }, [scrollTop]);

  return { scrollTop: Math.max(0, scrollTop - offset), isScrolling };
}

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

export type ScrollToNodeConfig = {
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
