import * as React from "react";
import trieMemoize from "trie-memoize";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { Observable } from "./tree/observable";
import { mergeProps as mergeProps_, throttle } from "./utils";

export function useNodePlugins(nodeId: number, plugins: NodePlugin[] = []) {
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
        unsubs.push(plugins[i].didChange.subscribe(callback));
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
  didChange: Observable<T>;
  getProps: (nodeId: number) => React.HTMLAttributes<HTMLElement>;
};
