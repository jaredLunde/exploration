import * as React from "react";
import type { Dir, FileTree, FileTreeNode } from "./file-tree";
import type { Subject } from "./tree/subject";
import type { WindowRef } from "./types";
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
export declare function useDnd(
  fileTree: FileTree,
  config: UseDndConfig
): UseDndPlugin;
export declare type DndEvent<Meta> =
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
export interface UseDndPlugin {
  /**
   * A subject that emits drag 'n drop events.
   */
  didChange: Subject<DndEvent<any> | null>;
  /**
   * Get the drag 'n drop props for a given node ID.
   */
  getProps: (nodeId: number) => DndProps | React.HTMLAttributes<HTMLElement>;
}
