import {
  clearRequestTimeout,
  requestTimeout,
} from "@essentials/request-timeout";
import useResizeObserver from "@react-hook/resize-observer";
import * as React from "react";
import { useSubscription } from "use-subscription";
import type { FileTree, FileTreeNode } from ".";
import { useTransition } from "./use-transition";
import { useVisibleNodes } from "./use-visible-nodes";

export function useVirtualize<Meta>(
  tree: FileTree<Meta>,
  {
    windowRef,
    nodeHeight,
    nodeGap = 0,
    overscanBy = 10,
  }: UseVirtualizeOptions<Meta>
) {
  const storedTree = React.useRef(tree);
  const visibleNodes = useVisibleNodes(tree);
  const scrollPosition = useScrollPosition(windowRef);
  const height = useHeight(windowRef);
  const scrollHeight = (nodeHeight + nodeGap) * visibleNodes.length - nodeGap;

  React.useEffect(() => {
    storedTree.current = tree;
  });

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
      style: {
        position: "relative",
        width: "100%",
        height: Math.ceil(scrollHeight),
        willChange: scrollPosition.isScrolling ? "contents" : void 0,
        pointerEvents: scrollPosition.isScrolling ? "none" : void 0,
      },
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
        const node = tree.getById(nodeId);
        if (!node) continue;

        children.push(
          render({
            node,
            props: {
              style: {
                position: "absolute",
                width: "100%",
                top: nodeGap * index + index * nodeHeight,
                left: 0,
              },
            },
            scrollToNode(config?: ScrollToNodeConfig) {
              scrollToNode(nodeId, config);
            },
          })
        );
      }

      return children;
    },
  };
}

export function useHeight(windowRef: WindowRef) {
  const [, startTransition] = useTransition();
  const getWindowHeight = () => {
    const windowEl =
      windowRef && "current" in windowRef ? windowRef.current : windowRef;

    if (windowEl instanceof HTMLElement) {
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

  useResizeObserver(windowRef instanceof Window ? null : windowRef, () => {
    startTransition(() => {
      setHeight(getWindowHeight());
    });
  });

  return useGlobalWindowHeight(windowRef) ?? height;
}

export function useGlobalWindowHeight(windowRef: WindowRef) {
  return useSubscription(
    React.useMemo(
      () => ({
        getCurrentValue() {
          if (typeof window !== "undefined" && windowRef instanceof Window) {
            return window.innerHeight;
          }

          return null;
        },
        subscribe(callback) {
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
    }, 1000 / 12);

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

export interface UseVirtualizeOptions<Meta> {
  width: number;
  height: number;
  nodes?: FileTreeNode<Meta>[];
  nodeHeight: number;
  nodeGap?: number;
  overscanBy?: number;
  windowRef: WindowRef;
}

export type WindowRef =
  | Window
  | React.MutableRefObject<HTMLElement | null>
  | HTMLElement
  | null;

export type ScrollToNodeConfig = {
  behavior?: "smooth" | "auto";
  align?: "auto" | "smart" | "center" | "start" | "end";
};

export interface VirtualizeRenderProps<Meta> {
  node: FileTreeNode<Meta>;
  props: Record<string, unknown>;
  scrollToNode(config?: ScrollToNodeConfig): void;
}
