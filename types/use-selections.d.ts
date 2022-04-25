import * as React from "react";
import type { FileTree } from "./file-tree";
import type { Subject } from "./tree/subject";
/**
 * A hook for adding select and multi-select to the file tree.
 *
 * @param fileTree - A file tree
 * @param nodes - When using a hook like `useFilter` you can supply the filtered list of
 *   nodes to this option. By default, `useVirtualize()` uses the nodes returned by
 *   `useVisibleNodes()`
 */
export declare function useSelections<Meta>(fileTree: FileTree<Meta>, nodes?: number[]): UseSelectionsPlugin;
export interface SelectionsProps {
    onClick: React.MouseEventHandler<HTMLElement>;
}
export interface UseSelectionsPlugin {
    /**
     * A subject that you can use to observe to changes to selections.
     */
    didChange: Subject<Set<number>>;
    /**
     * Get the React props for a given node ID.
     *
     * @param nodeId - A node ID
     */
    getProps(nodeId: number): SelectionsProps;
    /**
     * The head of the selections list
     */
    get head(): number | null;
    /**
     * The tail of the selections list
     */
    get tail(): number | null;
    /**
     * Select given node ids
     *
     * @param nodeIds - Node IDs
     */
    select(...nodeIds: number[]): void;
    /**
     * Deselect given node ids
     *
     * @param nodeIds - Node IDs
     */
    deselect(...nodeIds: number[]): void;
    /**
     * Clear all of the selections
     */
    clear(): void;
    /**
     * A utility function that yields nodes from a set of selections if they
     * don't have a parent node in the set.
     *
     * @yields {number} - A node id
     */
    narrow(): Generator<number, void, unknown>;
}
