import type * as React from "react";
import type { FileTree } from "./file-tree";
import type { Subject } from "./tree/subject";
/**
 * A plugin hook for adding roving focus to file tree nodes.
 *
 * @param fileTree - A file tree
 */
export declare function useRovingFocus<Meta>(fileTree: FileTree<Meta>): UseRovingFocusPlugin;
export interface RovingFocusProps {
    tabIndex: number;
    onFocus(e: React.FocusEvent<HTMLElement>): void;
    onBlur(e: React.FocusEvent<HTMLElement>): void;
}
export interface UseRovingFocusPlugin {
    /**
     * A subject that you can use to observe to changes to the focused node.
     */
    didChange: Subject<number>;
    /**
     * Get the React props for a given node ID.
     *
     * @param nodeId - A node ID
     */
    getProps: (nodeId: number) => RovingFocusProps;
}
