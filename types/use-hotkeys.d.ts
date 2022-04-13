import type { FileTree } from "./file-tree";
import type { WindowRef } from "./types";
import type { useRovingFocus } from "./use-roving-focus";
import type { useSelections } from "./use-selections";
export declare function useHotkeys(
  fileTree: FileTree,
  options: {
    nodes?: number[];
    windowRef: WindowRef;
    rovingFocus: ReturnType<typeof useRovingFocus>;
    selections: ReturnType<typeof useSelections>;
    querySelectorPattern?: string;
  }
): void;
