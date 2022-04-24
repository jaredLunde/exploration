import * as React from "react";
import trieMemoize from "trie-memoize";
import type { FileTree } from "./file-tree";
import { SubjectMap } from "./observable-data";
import type { Subject } from "./tree/subject";

/**
 * A hook that allows you to arbitrarily apply traits/decorations to nodes in the file
 * tree. For example, if you wanted to add a class name to a node in the tree if it were
 * selected, focused, et. al. you could use this hook to do that. Another example would
 * be the `M` modified decorations in VSCode.
 *
 * @param fileTree - A file tree
 * @param traits - The list of available traits that can be applied to nodes
 */
export function useTraits<Trait extends string>(
  fileTree: FileTree,
  traits: Trait[]
): UseTraitsPlugin<Trait> {
  const storedTraits = React.useRef(traits);
  const traitsMap = React.useMemo(() => getTraitsMap(fileTree), [fileTree]);

  React.useEffect(() => {
    storedTraits.current = traits;
  });

  return {
    didChange: traitsMap.didChange,
    getProps(nodeId) {
      let className = "";

      for (const [trait, set] of traitsMap) {
        if (set.has(nodeId)) {
          className += trait + " ";
        }
      }

      return createProps(className);
    },

    add(trait, ...nodeIds) {
      const traitSet = traitsMap.get(trait) ?? new Set<number>();

      for (let i = 0; i < nodeIds.length; i++) {
        const nodeId = nodeIds[i];
        traitSet.add(nodeId);
      }

      traitsMap.set(trait, traitSet);
    },

    set(trait, nodeIds) {
      const traitSet = traitsMap.get(trait) ?? new Set<number>();

      if (traitSet) {
        traitSet.clear();
      }

      for (let i = 0; i < nodeIds.length; i++) {
        traitSet.add(nodeIds[i]);
      }

      traitsMap.set(trait, traitSet);
    },

    delete(trait, nodeId) {
      const traitSet = traitsMap.get(trait) ?? new Set<number>();

      if (traitSet) {
        traitSet.delete(nodeId);
      }

      traitsMap.set(trait, traitSet);
    },

    clear(trait) {
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

    clearNode(nodeId) {
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
  SubjectMap<string, Set<number>>
>();

function getTraitsMap(fileTree: FileTree) {
  let traitsMap = fileTreeTraitsMap.get(fileTree);

  if (!traitsMap) {
    traitsMap = new SubjectMap<string, Set<number>>();
    fileTreeTraitsMap.set(fileTree, traitsMap);
  }

  return traitsMap;
}

export interface TraitsProps {
  className?: string;
}

export interface UseTraitsPlugin<Trait> {
  /**
   * A subject that you can use to observe to changes to traits.
   */
  didChange: Subject<Map<string, Set<number>>>;
  /**
   * Get the React props for a given node ID.
   *
   * @param nodeId - A node ID
   */
  getProps(nodeId: number): TraitsProps;
  /**
   * Adds a trait to given node IDs
   *
   * @param trait - The trait to apply to the given node IDs
   * @param nodeIds - Node IDs to add the traits to
   */
  add(trait: Extract<Trait, string>, ...nodeIds: number[]): void;
  /**
   * Sets node IDs to a given trait. This is different from add in
   * that it replaces any exist node IDs assigned to the trait.
   *
   * @param trait - The trait to apply to the given node IDs
   * @param nodeIds - Node IDs to add the traits to
   */
  set(trait: Extract<Trait, string>, nodeIds: number[]): void;
  /**
   * Deletes a node ID from a given trait
   *
   * @param trait - The trait
   * @param nodeId - The node ID to delete a trait for
   */
  delete(trait: Extract<Trait, string>, nodeId: number): void;
  /**
   * Clears all of the node IDs assigned to a given trait
   *
   * @param trait - The trait
   */
  clear(trait: Extract<Trait, string>): void;
  /**
   * Clears all of the node IDs assigned to all traits
   */
  clearAll(): void;
  /**
   * Clears the traits assigned to a given node ID
   *
   * @param nodeId - A node ID
   */
  clearNode(nodeId: number): void;
}
