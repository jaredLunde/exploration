import type { FileTree } from "./file-tree";
export declare function useTraits<Trait extends string>(
  fileTree: FileTree,
  traits: Trait[]
): {
  didChange: import(".").Observable<Map<string, Set<number>>>;
  getProps(nodeId: number): TraitsProps;
  add(trait: Extract<Trait, string>, ...nodeIds: number[]): void;
  set(trait: Extract<Trait, string>, nodeIds: number[]): void;
  delete(trait: Extract<Trait, string>, nodeId: number): void;
  clear(trait: Extract<Trait, string>): void;
  clearAll(): void;
  clearNode(nodeId: number): void;
};
export interface TraitsProps {
  className?: string;
}
