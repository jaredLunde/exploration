import * as React from "react";
import trieMemoize from "trie-memoize";
import type { Dir, FileTree, FileTreeNode } from "./file-tree";
import { isDir } from "./file-tree";
import type { Subject } from "./tree/subject";
import { pureSubject } from "./tree/subject";
import type { WindowRef } from "./types";
import { useObserver } from "./use-observer";
import { retryWithBackoff, shallowEqual } from "./utils";

/**
 * A plugin hook for adding drag and drop to the file tree.
 *
 * @param fileTree - A file tree
 * @param config - Configuration options
 * @param config.windowRef - A React ref created by useRef() or an HTML element for the
 *   container viewport you're rendering the list inside of.
 * @param config.dragOverExpandTimeout - Timeout for expanding a directory when a draggable
 *   element enters it.
 */
export function useDnd<Meta>(
  fileTree: FileTree<Meta>,
  config: UseDndConfig
): UseDndPlugin<Meta> {
  const storedConfig = React.useRef(config);
  const dnd = React.useMemo(() => createDnd(fileTree), [fileTree]);
  const storedTimeout = React.useRef<{
    id: number;
    timeout: ReturnType<typeof setTimeout> | null;
  }>({ id: -1, timeout: null });
  const storedDir = React.useRef<Dir | null>(null);

  React.useEffect(() => {
    storedConfig.current = config;
  });

  useObserver(dnd, (event) => {
    if (!event) return;

    if (event.type === "enter") {
      storedTimeout.current.timeout &&
        clearTimeout(storedTimeout.current.timeout);
      storedTimeout.current.id = event.dir.id;
      storedDir.current = event.dir;

      storedTimeout.current.timeout = setTimeout(() => {
        if (!event.dir.expanded) {
          retryWithBackoff(
            () =>
              fileTree.expand(event.dir).then(() => {
                if (event.dir === storedDir.current) {
                  dnd.setState({ ...event, type: "expanded" });
                }
              }),
            {
              shouldRetry() {
                return (
                  event.dir === storedDir.current &&
                  !fileTree.isExpanded(event.dir)
                );
              },
            }
          ).catch(() => {});
        }
      }, storedConfig.current.dragOverExpandTimeout ?? DEFAULT_DRAG_OVER_EXPAND_TIMEOUT);
    } else if (
      event.type === "end" ||
      (event.type === "leave" && storedTimeout.current.id === event.dir.id)
    ) {
      storedDir.current = null;
      storedTimeout.current.timeout &&
        clearTimeout(storedTimeout.current.timeout);
    } else if (event.type === "drop") {
      storedDir.current = null;
      storedTimeout.current.timeout &&
        clearTimeout(storedTimeout.current.timeout);
    }
  });

  React.useEffect(() => {
    const { windowRef } = storedConfig.current;
    const windowEl =
      windowRef && "current" in windowRef ? windowRef.current : windowRef;

    if (windowEl) {
      const handlers = createProps(dnd, fileTree.root);

      const isCurrentTarget = (event: Event) => {
        return (
          event.currentTarget instanceof HTMLElement &&
          (event.currentTarget === event.target ||
            event.currentTarget.firstChild === event.target)
        );
      };

      const handleDragEnter = (event: Event) => {
        if (isCurrentTarget(event)) {
          // @ts-expect-error: technically incompatible types but that is ok
          handlers.onDragEnter(event);
        }
      };
      const handleDragOver = (event: Event) => {
        if (isCurrentTarget(event)) {
          // @ts-expect-error: technically incompatible types but that is ok
          handlers.onDragOver(event);
        }
      };
      const handleDragLeave = (event: Event) => {
        if (isCurrentTarget(event)) {
          // @ts-expect-error: technically incompatible types but that is ok
          handlers.onDragLeave(event);
        }
      };
      const handleDrop = (event: Event) => {
        if (isCurrentTarget(event)) {
          // @ts-expect-error: technically incompatible types but that is ok
          handlers.onDrop(event);
        }
      };
      windowEl.addEventListener("dragenter", handleDragEnter);
      windowEl.addEventListener("dragover", handleDragOver);
      windowEl.addEventListener("dragleave", handleDragLeave);
      windowEl.addEventListener("drop", handleDrop);

      return () => {
        windowEl.removeEventListener("dragenter", handleDragEnter);
        windowEl.removeEventListener("dragover", handleDragOver);
        windowEl.removeEventListener("dragleave", handleDragLeave);
        windowEl.removeEventListener("drop", handleDrop);
      };
    }
  }, [dnd, fileTree.root]);

  return {
    didChange: dnd,

    getProps(nodeId) {
      const node = fileTree.getById(nodeId);
      if (!node) return empty;
      return createProps(dnd, node);
    },
  };
}

const DEFAULT_DRAG_OVER_EXPAND_TIMEOUT = 400;
const empty = {};

const createProps = trieMemoize(
  [WeakMap, WeakMap],
  <Meta>(
    dnd: Subject<DndEvent<Meta> | null>,
    node: FileTreeNode<Meta>
  ): DndProps => ({
    draggable: true,

    onDragStart() {
      dnd.setState({ type: "start", node });
    },

    onDragEnd() {
      dnd.setState({ type: "end", node });
    },

    onDragEnter() {
      const dir = isDir(node) ? node : node.parent;
      const state = dnd.getState();

      if (dir && state?.node) {
        dnd.setState({ type: "enter", node: state.node, dir });
      }
    },

    onDragOver(event) {
      event.preventDefault();
    },

    onDragLeave() {
      const dir = isDir(node) ? node : node.parent;
      const state = dnd.getState();

      if (dir && state && state.type === "enter" && state.node) {
        dnd.setState({ type: "leave", node: state.node, dir });
      }
    },

    onDrop() {
      const dir = isDir(node) ? node : node.parent;
      const state = dnd.getState();

      if (dir && state?.node) {
        dnd.setState({ type: "drop", node: state.node, dir });
      }
    },
  })
);

const createDnd = trieMemoize([WeakMap], <Meta>(fileTree: FileTree<Meta>) => {
  return pureSubject<DndEvent<Meta> | null>(null, shallowEqual);
});

export type DndEvent<Meta> =
  | {
      type: "start";
      /**
       * The node that is being dragged
       */
      node: FileTreeNode<Meta>;
    }
  | {
      type: "end";
      /**
       * The node that is being dragged
       */
      node: FileTreeNode<Meta>;
    }
  | {
      type: "enter";
      /**
       * The node that is being dragged
       */
      node: FileTreeNode<Meta>;
      /**
       * The directory that the node is being dragged over
       */
      dir: Dir<Meta>;
    }
  | {
      type: "expanded";
      /**
       * The node that is being dragged
       */
      node: FileTreeNode<Meta>;
      /**
       * The directory that the node is being dragged over
       */
      dir: Dir<Meta>;
    }
  | {
      type: "leave";
      /**
       * The node that is being dragged
       */
      node: FileTreeNode<Meta>;
      /**
       * The directory that the node was being dragged over
       */
      dir: Dir<Meta>;
    }
  | {
      type: "drop";
      /**
       * The node that is being dragged
       */
      node: FileTreeNode<Meta>;
      /**
       * The directory that the node is being dragged over
       */
      dir: Dir<Meta>;
    };

export interface DndProps {
  draggable: true;
  onDragStart: React.MouseEventHandler<HTMLElement>;
  onDragEnd: React.MouseEventHandler<HTMLElement>;
  onDragOver: React.MouseEventHandler<HTMLElement>;
  onDragEnter: React.MouseEventHandler<HTMLElement>;
  onDragLeave: React.MouseEventHandler<HTMLElement>;
  onDrop: React.MouseEventHandler<HTMLElement>;
}

export interface UseDndConfig {
  /**
   * Timeout for expanding a directory when a draggable element enters it.
   */
  dragOverExpandTimeout?: number;
  /**
   * A React ref created by useRef() or an HTML element for the container viewport
   * you're rendering the list inside of.
   */
  windowRef: WindowRef;
}

export interface UseDndPlugin<Meta> {
  /**
   * A subject that emits drag 'n drop events.
   */
  didChange: Subject<DndEvent<Meta> | null>;
  /**
   * Get the drag 'n drop props for a given node ID.
   */
  getProps: (nodeId: number) => DndProps | React.HTMLAttributes<HTMLElement>;
}
