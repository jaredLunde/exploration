import * as React from "react";
import trieMemoize from "trie-memoize";
import type { FileTree } from "./file-tree";
import { ObservableMap, ObservableSet } from "./observable-data";

export function useDecorations<Decor extends string>(
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

  const [createProps] = React.useState(() =>
    trieMemoize(
      [WeakMap, WeakMap, {}],
      (
        decorations: ObservableMap<string, ObservableSet<number>>,
        _: ReturnType<
          ObservableMap<
            string,
            ObservableSet<number>
          >["didChange"]["getSnapshot"]
        >,
        nodeId: number
      ) => {
        let className = "";

        for (const [decoration, set] of decorations.entries()) {
          if (set.has(nodeId)) {
            className += decoration + " ";
          }
        }

        return { className: className.slice(0, -1) };
      }
    )
  );

  return React.useMemo(() => {
    return {
      didChange: decorationsMap.didChange,

      getProps(nodeId: number) {
        return createProps(
          decorationsMap,
          decorationsMap.didChange.getSnapshot(),
          nodeId
        );
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
  }, [createProps, decorationsMap]);
}

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
