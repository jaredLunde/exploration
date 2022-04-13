import * as React from "react";
import type { FileTree } from "./file-tree";
import type { Observable } from "./tree/observable";
export declare function useRovingFocus<Meta>(fileTree: FileTree<Meta>): {
  didChange: Observable<number>;
  getProps: (nodeId: number) => RovingFocusProps;
};
export interface RovingFocusProps {
  tabIndex: number;
  onFocus(e: React.FocusEvent<HTMLElement>): void;
  onBlur(e: React.FocusEvent<HTMLElement>): void;
}
