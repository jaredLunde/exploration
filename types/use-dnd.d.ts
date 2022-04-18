import * as React from "react";
import type { Dir, FileTree, FileTreeNode } from "./file-tree";
import type { Observable } from "./tree/observable";
/**
 * A plugin hook for adding drag and drop to the file tree.
 *
 * @param fileTree - A file tree
 * @param config - Configuration options
 * @param config.dragOverExpandTimeout
 */
export declare function useDnd(fileTree: FileTree, config?: UseDndConfig): UseDndPlugin;
export declare type DndEvent<Meta> = {
    type: "start";
    /**
     * The node that is being dragged
     */
    node: FileTreeNode<Meta>;
} | {
    type: "end";
    /**
     * The node that is being dragged
     */
    node: FileTreeNode<Meta>;
} | {
    type: "enter";
    /**
     * The node that is being dragged
     */
    node: FileTreeNode<Meta>;
    /**
     * The directory that the node is being dragged over
     */
    dir: Dir<Meta>;
} | {
    type: "expanded";
    /**
     * The node that is being dragged
     */
    node: FileTreeNode<Meta>;
    /**
     * The directory that the node is being dragged over
     */
    dir: Dir<Meta>;
} | {
    type: "leave";
    /**
     * The node that is being dragged
     */
    node: FileTreeNode<Meta>;
    /**
     * The directory that the node was being dragged over
     */
    dir: Dir<Meta>;
} | {
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
