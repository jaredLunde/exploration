import memoizeOne from "@essentials/memoize-one";
import * as React from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { Subject } from "./tree/subject";
import { mergeProps as mergeProps_ } from "./utils";

/**
 * A hook that observes to plugins and retrieves props that should be applied
 * to a given node. An example of a plugin wouuld be the `useTraits()` hook.
 *
 * @param nodeId - The node ID used to retrieve props from a plugin
 * @param plugins - A list of file tree plugins
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
  const subject = createSubject(plugins);
  const mergeProps = React.useRef(
    memoizeOne(mergeProps_, (a, b) => shallowEqualArray(a[0], b[0]))
  ).current;
  const storedPlugins = React.useRef(plugins);

  React.useEffect(() => {
    storedPlugins.current = plugins;
  });

  const getSnapshot = React.useCallback(() => {
    const plugins = storedPlugins.current;
    const length = plugins.length;
    const props: React.HTMLAttributes<HTMLElement>[] = new Array(length);
    for (let i = 0; i < length; i++) props[i] = plugins[i].getProps(nodeId);
    return mergeProps(props);
  }, [mergeProps, nodeId]);

  return useSyncExternalStore(subject, getSnapshot, getSnapshot);
}

const createSubject = memoizeOne((plugins: NodePlugin[]) => {
  return function subject(onStoreChange: () => void) {
    const numPlugins = plugins.length;
    const unsubs: (() => void)[] = new Array(numPlugins);
    let i = 0;
    for (; i < numPlugins; i++)
      unsubs[i] = plugins[i].didChange.observe(onStoreChange);
    return () => {
      for (i = 0; i < unsubs.length; i++) unsubs[i]();
    };
  };
}, shallowEqualArray);

function shallowEqualArray(a: any[], b: any[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
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
