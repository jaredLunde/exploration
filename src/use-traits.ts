import * as React from "react";
import trieMemoize from "trie-memoize";
import type { FileTree } from "./file-tree";
import { ObservableMap, ObservableSet } from "./observable-data";

export function useTraits<Decor extends string>(
  fileTree: FileTree,
  decorations: Decor[]
) {
  const storedDecorations = React.useRef(decorations);

  React.useEffect(() => {
    storedDecorations.current = decorations;
  });

  const [decorationsMap, setDecorationsMap] = React.useState(() =>
    getDecorationsMap(fileTree)
  );

  React.useEffect(() => {
    setDecorationsMap(getDecorationsMap(fileTree));
  }, [fileTree]);

  return {
    didChange: decorationsMap.didChange,

    getProps(nodeId: number) {
      let className = "";

      for (const [decoration, set] of decorationsMap) {
        if (set.has(nodeId)) {
          className += decoration + " ";
        }
      }

      return createProps(className);
    },

    add(decoration: Extract<Decor, string>, ...nodeIds: number[]) {
      const decorationSet =
        decorationsMap.get(decoration) ?? new ObservableSet<number>();

      for (let i = 0; i < nodeIds.length; i++) {
        const nodeId = nodeIds[i];
        decorationSet.add(nodeId);
      }

      decorationsMap.set(decoration, decorationSet);
    },

    set(decoration: Extract<Decor, string>, nodeIds: number[]) {
      const current =
        decorationsMap.get(decoration) ?? new ObservableSet<number>();

      if (current) {
        for (const nodeId of current) {
          this.delete(decoration, nodeId);
        }

        current.clear();
      }

      for (let i = 0; i < nodeIds.length; i++) {
        current.add(nodeIds[i]);
      }

      decorationsMap.set(decoration, current);
    },

    delete(decoration: Extract<Decor, string>, nodeId: number) {
      const decorationSet =
        decorationsMap.get(decoration) ?? new ObservableSet<number>();

      if (decorationSet) {
        decorationSet.delete(nodeId);
      }

      decorationsMap.set(decoration, decorationSet);
    },

    clear(decoration: Extract<Decor, string>) {
      const decorationSet =
        decorationsMap.get(decoration) ?? new ObservableSet<number>();
      decorationSet.clear();
      decorationsMap.set(decoration, decorationSet);
    },

    clearAll() {
      for (const decoration of storedDecorations.current) {
        const decorationSet =
          decorationsMap.get(decoration) ?? new ObservableSet<number>();
        decorationSet.clear();
        decorationsMap.set(decoration, decorationSet);
      }
    },

    clearNode(nodeId: number) {
      for (const decoration of storedDecorations.current) {
        const decorationSet =
          decorationsMap.get(decoration) ?? new ObservableSet<number>();
        decorationSet.delete(nodeId);
        decorationsMap.set(decoration, decorationSet);
      }
    },
  };
}

const createProps = trieMemoize([Map], (className: string) => {
  return { className: className.slice(0, -1) };
});

const fileTreeDecorationsMap = new WeakMap<
  FileTree,
  ObservableMap<string, ObservableSet<number>>
>();

function getDecorationsMap(fileTree: FileTree) {
  let decorationsMap = fileTreeDecorationsMap.get(fileTree);

  if (!decorationsMap) {
    decorationsMap = new ObservableMap<string, ObservableSet<number>>();
    fileTreeDecorationsMap.set(fileTree, decorationsMap);
  }

  return decorationsMap;
}
