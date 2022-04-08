import * as React from "react";
import trieMemoize from "trie-memoize";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { Observable } from "./tree/observable";
import { mergeProps as mergePropsBase } from "./utils";

export function useNodeProps(nodeId: number, plugins: NodePlugin[] = []) {
  const numPlugins = plugins.length;
  const mergeProps = React.useMemo(() => {
    const caches: WeakMapConstructor[] = [];
    for (let i = 0; i < numPlugins; i++) caches.push(WeakMap);

    return trieMemoize(
      caches,
      (...props: React.HTMLAttributes<HTMLElement>[]) => {
        return mergePropsBase(...props);
      }
    );
  }, [numPlugins]);

  return useSyncExternalStore(
    (callback) => {
      const unsubs = plugins.map((subscription) =>
        subscription.didChange.subscribe(callback)
      );

      return () => {
        unsubs.forEach((unsub) => unsub);
      };
    },
    () => {
      return mergeProps(
        ...plugins.map((subscription) => subscription.getProps(nodeId))
      );
    },
    () => {
      return mergeProps(
        ...plugins.map((subscription) => subscription.getProps(nodeId))
      );
    }
  );
}

export type NodePlugin<T = unknown> = {
  didChange: Observable<T>;
  getProps: (nodeId: number) => React.HTMLAttributes<HTMLElement>;
};
