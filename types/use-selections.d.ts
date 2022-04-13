import * as React from "react";
import type { FileTree } from "./file-tree";
export declare function useSelections<Meta>(
  fileTree: FileTree<Meta>,
  nodes?: number[]
): {
  didChange: import(".").Observable<Set<number>>;
  readonly head: number | null;
  readonly tail: number | null;
  getProps(nodeId: number): SelectionsProps;
  select(...nodeIds: number[]): void;
  deselect(...nodeIds: number[]): void;
  clear(): void;
};
export interface SelectionsProps {
  onClick: React.MouseEventHandler<HTMLElement>;
}
