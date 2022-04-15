import {
  clearRequestTimeout,
  requestTimeout,
} from "@essentials/request-timeout";
import * as React from "react";
import trieMemoize from "trie-memoize";
import { useSubscription } from "use-subscription";
import type { FileTree, FileTreeNode } from "./file-tree";
import type { WindowRef } from "./types";
import { useResizeObserver } from "./use-resize-observer";
import { useTransition } from "./use-transition";
import { useVisibleNodes } from "./use-visible-nodes";
import { throttle } from "./utils";

export function useVirtualize<Meta>(
  fileTree: FileTree<Meta>,
  {
    windowRef,
    nodes,
    nodeHeight,
    nodeGap = 0,
    overscanBy = 2,
    ResizeObserver,
  }: UseVirtualizeOptions
) {
  const _visibleNodes = useVisibleNodes(fileTree);
  const visibleNodes = nodes ?? _visibleNodes;
  const scrollPosition = useScrollPosition(windowRef);
  const height = useHeight(windowRef, ResizeObserver);
  const scrollHeight = (nodeHeight + nodeGap) * visibleNodes.length - nodeGap;

  function scrollToNode(nodeId: number, config: ScrollToNodeConfig = {}) {
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
  }

  return {
    scrollTop: scrollPosition.scrollTop,
    isScrolling: scrollPosition.isScrolling,
    scrollToNode,
    props: {
      tabIndex: 0,
      style: {
        position: "relative",
        width: "100%",
        height: Math.max(Math.ceil(scrollHeight), height),
        contain: "strict",
        userSelect: "none",
        pointerEvents: scrollPosition.isScrolling ? "none" : undefined,
      } as React.CSSProperties,
    },
    map(render: (config: VirtualizeRenderProps<Meta>) => React.ReactElement) {
      const totalNodeHeight = nodeHeight + nodeGap;
      overscanBy = height * overscanBy;

      let index = Math.floor(
        Math.max(0, scrollPosition.scrollTop - overscanBy / 2) / totalNodeHeight
      );
      const stopIndex = Math.min(
        visibleNodes.length,
        Math.ceil((scrollPosition.scrollTop + overscanBy) / totalNodeHeight)
      );
      const children: React.ReactElement[] = [];

      for (; index < stopIndex; index++) {
        const nodeId = visibleNodes[index];
        const node = fileTree.getById(nodeId);
        if (!node) continue;

        children.push(
          render({
            key: nodeId,
            index,
            node,
            tree: fileTree,
            style: createStyle(
              nodeHeight,
              nodeGap * index + index * nodeHeight
            ),
          })
        );
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
    typeof window === "undefined" || windowRef instanceof Window
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
  return useSubscription(
    React.useMemo(
      () => ({
        getCurrentValue() {
          if (typeof window !== "undefined" && windowRef === window) {
            return window.innerHeight;
          }

          return null;
        },
        subscribe(callback) {
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
      }),
      [windowRef]
    )
  );
}

export function useScrollPosition(
  windowRef: WindowRef,
  { offset = 0 }: UseScrollPosition = {}
): { scrollTop: number; isScrolling: boolean } {
  const [isScrolling, setIsScrolling] = React.useState(false);
  const scrollTop = useSubscription(
    React.useMemo(
      () => ({
        getCurrentValue() {
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
        },

        subscribe(callback) {
          const current =
            windowRef && "current" in windowRef ? windowRef.current : windowRef;
          callback = throttle(callback, 12, true);

          if (current) {
            current.addEventListener("scroll", callback);

            return () => {
              window.removeEventListener("scroll", callback);
            };
          }

          return () => {};
        },
      }),
      [windowRef]
    )
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

export interface UseVirtualizeOptions {
  nodes?: number[];
  nodeHeight: number;
  nodeGap?: number;
  overscanBy?: number;
  windowRef: WindowRef;
  ResizeObserver?: any;
}

export type ScrollToNodeConfig = {
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
