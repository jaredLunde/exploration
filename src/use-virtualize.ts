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
  { overscanBy = 10, itemHeight, itemGap = 0, windowRef }: UseVirtualizeOptions
) {
  const visibleNodes = useVisibleNodes(tree);
  const scrollPosition = useScrollPosition(windowRef);
  const height = useHeight(windowRef);

  return {
    scrollTop: scrollPosition.scrollTop,
    isScrolling: scrollPosition.isScrolling,
    map(render: (node: FileTreeNode<Meta>) => React.ReactElement) {
      const totalItemHeight = itemHeight + itemGap;
      overscanBy = height * overscanBy;

      let index = Math.floor(
        Math.max(0, scrollPosition.scrollTop - overscanBy / 2) / totalItemHeight
      );

      const stopIndex = Math.min(
        visibleNodes?.length ?? 0,
        Math.ceil((scrollPosition.scrollTop + overscanBy) / totalItemHeight)
      );
      const children: React.ReactElement[] = [];

      if (!visibleNodes) {
        return children;
      }

      for (; index < stopIndex; index++) {
        const node = tree.getById(visibleNodes[index]);
        if (!node) continue;
        const child = render(node);
        children.push(
          React.cloneElement(child, {
            style: {
              position: "absolute",
              width: "100%",
              top: itemGap * index + index * itemHeight,
              left: 0,
            },
          })
        );
      }

      return children;
    },
  };
}

export function useHeight(windowRef: UseVirtualizeOptions["windowRef"]) {
  const [, startTransition] = useTransition();
  const getWindowHeight = () => {
    const windowEl =
      windowRef && "current" in windowRef ? windowRef.current : windowRef;

    if (windowEl instanceof HTMLElement) {
      return windowEl.offsetHeight;
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

export function useGlobalWindowHeight(
  windowRef: UseVirtualizeOptions["windowRef"]
) {
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
  windowRef: UseVirtualizeOptions["windowRef"],
  { offset = 0 }: UseScrollPosition = {}
): { scrollTop: number; isScrolling: boolean } {
  const [isScrolling, setIsScrolling] = React.useState(false);
  const scrollTop = useSubscription(
    React.useMemo(
      () => ({
        getCurrentValue() {
          const current =
            windowRef && "current" in windowRef ? windowRef.current : windowRef;

          if (typeof window !== "undefined" && windowRef instanceof Window) {
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
      to && clearRequestTimeout(to);
      didUnmount = true;
    };
  }, [scrollTop]);

  return { scrollTop: Math.max(0, scrollTop - offset), isScrolling };
}

export interface UseScrollPosition {
  offset?: number;
}

export interface UseVirtualizeOptions {
  width: number;
  height: number;
  itemHeight: number;
  itemGap?: number;
  overscanBy?: number;
  windowRef:
    | Window
    | React.MutableRefObject<HTMLElement | null>
    | HTMLElement
    | null;
}
