import type { FileTree } from "./file-tree";
import type { Observable } from "./tree/observable";
/**
 * A hook that allows you to arbitrarily apply traits/decorations to nodes in the file
 * tree. For example, if you wanted to add a class name to a node in the tree if it were
 * selected, focused, et. al. you could use this hook to do that. Another example would
 * be the `M` modified decorations in VSCode.
 *
 * @param fileTree - A file tree
 * @param traits - The list of available traits that can be applied to nodes
 */
export declare function useTraits<Trait extends string>(fileTree: FileTree, traits: Trait[]): UseTraitsPlugin<Trait>;
export interface TraitsProps {
    className?: string;
}
export interface UseTraitsPlugin<Trait> {
    /**
     * An observable that you can use to subscribe to changes to traits.
     */
    didChange: Observable<Map<string, Set<number>>>;
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
