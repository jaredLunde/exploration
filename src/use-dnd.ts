import * as React from "react";
import trieMemoize from "trie-memoize";
import type { Dir, FileTree, FileTreeNode } from "./file-tree";
import { isDir } from "./file-tree";
import type { Observable } from "./tree/observable";
import { pureObservable } from "./tree/observable";
import { useObservable } from "./use-observable";
import { shallowEqual } from "./utils";

/**
 * A plugin hook for adding drag and drop to the file tree.
 *
 * @param fileTree - A file tree
 * @param config - Configuration options
 * @param config.dragOverExpandTimeout
 */
export function useDnd(
  fileTree: FileTree,
  config: UseDndConfig = {}
): UseDndPlugin {
  const storedOptions = React.useRef(config);
  const dnd = React.useMemo(() => createDnd(fileTree), [fileTree]);
  const storedTimeout = React.useRef<{
    id: number;
    timeout: ReturnType<typeof setTimeout> | null;
  }>({ id: -1, timeout: null });
  const storedDir = React.useRef<Dir | null>(null);

  React.useEffect(() => {
    storedOptions.current = config;
  });

  useObservable(dnd, (event) => {
    if (!event) return;

    if (event.type === "enter") {
      storedTimeout.current.timeout &&
        clearTimeout(storedTimeout.current.timeout);
      storedTimeout.current.id = event.dir.id;
      storedDir.current = event.dir;

      storedTimeout.current.timeout = setTimeout(() => {
        if (!event.dir.expanded) {
          fileTree.expand(event.dir).then(() => {
            if (event.dir === storedDir.current) {
              dnd.next({ ...event, type: "expanded" });
            }
          });
        }
      }, storedOptions.current.dragOverExpandTimeout ?? DEFAULT_DRAG_OVER_EXPAND_TIMEOUT);
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
    dnd: Observable<DndEvent<Meta> | null>,
    node: FileTreeNode<Meta>
  ): DndProps => ({
    draggable: true,

    onDragStart() {
      dnd.next({ type: "start", node });
    },

    onDragEnd() {
      dnd.next({ type: "end", node });
    },

    onDragEnter() {
      const dir = isDir(node) ? node : node.parent;
      const snapshot = dnd.getSnapshot();

      if (dir && snapshot?.node) {
        dnd.next({ type: "enter", node: snapshot.node, dir });
      }
    },

    onDragOver(event) {
      event.preventDefault();
    },

    onDragLeave() {
      const dir = isDir(node) ? node : node.parent;
      const snapshot = dnd.getSnapshot();

      if (
        dir &&
        snapshot &&
        snapshot.type === "enter" &&
        snapshot.dir !== dir &&
        snapshot.node
      ) {
        dnd.next({ type: "leave", node: snapshot.node, dir });
      }
    },

    onDrop() {
      const dir = isDir(node) ? node : node.parent;
      const snapshot = dnd.getSnapshot();

      if (dir && snapshot?.node) {
        dnd.next({ type: "drop", node: snapshot.node, dir });
      }
    },
  })
);

const createDnd = trieMemoize([WeakMap], <Meta>(fileTree: FileTree<Meta>) => {
  return pureObservable<DndEvent<Meta> | null>(null, shallowEqual);
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
}

export interface UseDndPlugin {
  /**
   * An observable that emits drag 'n drop events.
   */
  didChange: Observable<DndEvent<any> | null>;
  /**
   * Get the drag 'n drop props for a given node ID.
   */
  getProps: (nodeId: number) => DndProps | React.HTMLAttributes<HTMLElement>;
}
