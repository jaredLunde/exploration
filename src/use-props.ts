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
  const mergeProps = React.useMemo(
    () =>
      trieMemoize(
        subscriptions.map(() => WeakMap),
        (...props: React.HTMLAttributes<HTMLElement>[]) => {
          return mergePropsBase(...props);
        }
      ),
    [subscriptions.length]
  );

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
