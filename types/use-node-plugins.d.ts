import * as React from "react";
import type { Observable } from "./tree/observable";
export declare function useNodePlugins(
  nodeId: number,
  plugins?: NodePlugin[]
): React.HTMLAttributes<HTMLElement>;
export declare type NodePlugin<T = unknown> = {
  didChange: Observable<T>;
  getProps: (nodeId: number) => React.HTMLAttributes<HTMLElement>;
};
