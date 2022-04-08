import trieMemoize from "trie-memoize";
import type { FileTree } from "./file-tree";

export function useDnd(fileTree: FileTree) {
  return null;
}

const createProps = trieMemoize(
  [],
  (): DndProps => ({
    draggable: true,
    onDragStart(event) {},
    onDragEnd(event) {},
    onDrag(event) {},
    onDragOver(event) {},
    onDrop(event) {},
  })
);

export interface DndProps {
  draggable: true;
  onDragStart: React.MouseEventHandler<HTMLElement>;
  onDragEnd: React.MouseEventHandler<HTMLElement>;
  onDrag: React.MouseEventHandler<HTMLElement>;
  onDragOver: React.MouseEventHandler<HTMLElement>;
  onDrop: React.MouseEventHandler<HTMLElement>;
}
