import * as React from "react";
import trieMemoize from "trie-memoize";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { Observable } from "./tree/observable";
import { mergeProps as mergePropsBase } from "./utils";

export function useProps(
  nodeId: number,
  subscriptions: {
    didChange: Observable<unknown>;
    getProps: (nodeId: number) => React.HTMLAttributes<HTMLElement>;
  }[]
) {
  const numSubscriptions = subscriptions.length;
  const mergeProps = React.useMemo(() => {
    const caches: WeakMapConstructor[] = [];
    for (let i = 0; i < numSubscriptions; i++) caches.push(WeakMap);

    return trieMemoize(
      caches,
      (...props: React.HTMLAttributes<HTMLElement>[]) => {
        return mergePropsBase(...props);
      }
    );
  }, [numSubscriptions]);

  return useSyncExternalStore(
    (callback) => {
      const unsubs = subscriptions.map((subscription) =>
        subscription.didChange.subscribe(callback)
      );

      return () => {
        unsubs.forEach((unsub) => unsub);
      };
    },
    () => {
      return mergeProps(
        ...subscriptions.map((subscription) => subscription.getProps(nodeId))
      );
    },
    () => {
      return mergeProps(
        ...subscriptions.map((subscription) => subscription.getProps(nodeId))
      );
    }
  );
}
