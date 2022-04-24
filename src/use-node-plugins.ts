import * as React from "react";
import trieMemoize from "trie-memoize";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { Subject } from "./tree/subject";
import { mergeProps as mergeProps_, throttle } from "./utils";

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
export function useNodePlugins(
  nodeId: number,
  plugins: NodePlugin[] = []
): React.HTMLAttributes<HTMLElement> {
  const numPlugins = plugins.length;
  const mergeProps = React.useMemo(() => {
    const caches: WeakMapConstructor[] = [];
    for (let i = 0; i < numPlugins; i++) caches.push(WeakMap);

    return trieMemoize(
      caches,
      (...props: React.HTMLAttributes<HTMLElement>[]) => {
        return mergeProps_(props);
      }
    );
  }, [numPlugins]);

  function getSnapshot() {
    const props: React.HTMLAttributes<HTMLElement>[] = [];

    for (let i = 0; i < numPlugins; i++) {
      props.push(plugins[i].getProps(nodeId));
    }

    return mergeProps(...props);
  }

  return useSyncExternalStore(
    (callback) => {
      callback = throttle(callback, 60);
      const unsubs: (() => void)[] = [];

      for (let i = 0; i < numPlugins; i++) {
        unsubs.push(plugins[i].didChange.observe(callback));
      }

      return () => {
        for (let i = 0; i < unsubs.length; i++) unsubs[i]();
      };
    },
    getSnapshot,
    getSnapshot
  );
}

export type NodePlugin<T = unknown> = {
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
