import type { FileTree } from "./file-tree";
import type { WindowRef } from "./types";
import type { useRovingFocus } from "./use-roving-focus";
import type { useSelections } from "./use-selections";
/**
 * A hook for adding standard hotkeys to the file tree.
 *
 * @param fileTree - A file tree
 * @param config - Configuration options
 */
export declare function useHotkeys(fileTree: FileTree, config: UseHotkeysConfig): void;
export interface UseHotkeysConfig {
    /**
     * When using a hook like `useFilter` you can supply the filtered list of
     * nodes to this option. By default, `useVirtualize()` uses the nodes returned
     * by `useVisibleNodes()`
     */
    nodes?: number[];
    /**
     * A React ref created by useRef() or an HTML element for the container viewport
     * you're rendering the list inside of.
     */
    windowRef: WindowRef;
    /**
     * The returned value of the `useRovingFocus()` plugin
     */
    rovingFocus: ReturnType<typeof useRovingFocus>;
    /**
     * The returned value of the `useSelections()` plugin
     */
    selections: ReturnType<typeof useSelections>;
    /**
     * A pattern to use for selecting the elements in the list. Must contain an
     * `{index}` placeholder for the index of the element to select.
     */
    querySelectorPattern?: string;
}
