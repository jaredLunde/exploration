import * as React from "react";
import type { Dir, FileTree, FileTreeNode } from "./file-tree";
import type { Observable } from "./tree/observable";
export declare function useDnd(
  fileTree: FileTree,
  options?: {
    dragOverExpandTimeout?: number;
  }
): {
  didChange: Observable<DndEvent<{}> | null>;
  getProps(nodeId: number): {};
};
export declare type DndEvent<Meta> =
  | {
      type: "start";
      node: FileTreeNode<Meta>;
    }
  | {
      type: "end";
      node: FileTreeNode<Meta>;
    }
  | {
      type: "enter";
      node: FileTreeNode<Meta>;
      dir: Dir<Meta>;
    }
  | {
      type: "expanded";
      node: FileTreeNode<Meta>;
      dir: Dir<Meta>;
    }
  | {
      type: "leave";
      node: FileTreeNode<Meta>;
      dir: Dir<Meta>;
    }
  | {
      type: "drop";
      node: FileTreeNode<Meta>;
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
