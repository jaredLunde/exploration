import * as React from "react";
import type { Subject } from "./tree/subject";
/**
 * A hook that observes to plugins and retrieves props that should be applied
 * to a given node. An example of a plugin wouuld be the `useTraits()` hook.
 *
 * @param nodeId - The node ID used to retrieve props from a plugin
 * @param plugins - A list of file tree plugins
 * @returns A memoized set of props returned by the plugins
 * @example
 * ```ts
 * const traits = useTraits(fileTree)
 * const props = useNodePlugins(fileTree.visibleNodes[0], [traits])
 * return <div {...props}>...</div>
 * ```
 */
export declare function useNodePlugins(
  nodeId: number,
  plugins?: NodePlugin[]
): React.HTMLAttributes<HTMLElement>;
export declare type NodePlugin<T = unknown> = {
  /**
   * A subject that the `useNodePlugins()` hook will observe to.
   */
  didChange: Subject<T>;
  /**
   * A function that returns React props based on a node ID.
   *
   * @param nodeId - The ID of a node in the file tree.
   */
  getProps(nodeId: number): React.HTMLAttributes<HTMLElement>;
};
