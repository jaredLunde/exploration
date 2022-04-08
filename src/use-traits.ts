import * as React from "react";
import trieMemoize from "trie-memoize";
import type { FileTree } from "./file-tree";
import { ObservableMap } from "./observable-data";

export function useTraits<Trait extends string>(
  fileTree: FileTree,
  traits: Trait[]
) {
  const storedTraits = React.useRef(traits);
  const traitsMap = React.useMemo(() => getTraitsMap(fileTree), [fileTree]);

  React.useEffect(() => {
    storedTraits.current = traits;
  });

  return {
    didChange: traitsMap.didChange,

    getProps(nodeId: number) {
      let className = "";

      for (const [trait, set] of traitsMap) {
        if (set.has(nodeId)) {
          className += trait + " ";
        }
      }

      return createProps(className);
    },

    add(trait: Extract<Trait, string>, ...nodeIds: number[]) {
      const traitSet = traitsMap.get(trait) ?? new Set<number>();

      for (let i = 0; i < nodeIds.length; i++) {
        const nodeId = nodeIds[i];
        traitSet.add(nodeId);
      }

      traitsMap.set(trait, traitSet);
    },

    set(trait: Extract<Trait, string>, nodeIds: number[]) {
      const traitSet = traitsMap.get(trait) ?? new Set<number>();

      if (traitSet) {
        traitSet.clear();
      }

      for (let i = 0; i < nodeIds.length; i++) {
        traitSet.add(nodeIds[i]);
      }

      traitsMap.set(trait, traitSet);
    },

    delete(trait: Extract<Trait, string>, nodeId: number) {
      const traitSet = traitsMap.get(trait) ?? new Set<number>();

      if (traitSet) {
        traitSet.delete(nodeId);
      }

      traitsMap.set(trait, traitSet);
    },

    clear(trait: Extract<Trait, string>) {
      const traitSet = traitsMap.get(trait) ?? new Set<number>();
      traitSet.clear();
      traitsMap.set(trait, traitSet);
    },

    clearAll() {
      for (const trait of storedTraits.current) {
        const traitSet = traitsMap.get(trait) ?? new Set<number>();
        traitSet.clear();
        traitsMap.set(trait, traitSet);
      }
    },

    clearNode(nodeId: number) {
      for (const trait of storedTraits.current) {
        const traitSet = traitsMap.get(trait) ?? new Set<number>();
        traitSet.delete(nodeId);
        traitsMap.set(trait, traitSet);
      }
    },
  };
}

const createProps = trieMemoize([Map], (className: string): TraitsProps => {
  return { className: className.slice(0, -1) };
});

const fileTreeTraitsMap = new WeakMap<
  FileTree,
  ObservableMap<string, Set<number>>
>();

function getTraitsMap(fileTree: FileTree) {
  let traitsMap = fileTreeTraitsMap.get(fileTree);

  if (!traitsMap) {
    traitsMap = new ObservableMap<string, Set<number>>();
    fileTreeTraitsMap.set(fileTree, traitsMap);
  }

  return traitsMap;
}

export interface TraitsProps {
  className?: string;
}
