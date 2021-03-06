import { useHotkeys as useHotkeys_ } from "@react-hook/hotkey";
import type { FileTree } from "./file-tree";
import { isDir } from "./file-tree";
import type { WindowRef } from "./types";
import type { useRovingFocus } from "./use-roving-focus";
import type { useSelections } from "./use-selections";
import { useVisibleNodes } from "./use-visible-nodes";
import { retryWithBackoff } from "./utils";

/**
 * A hook for adding standard hotkeys to the file tree.
 *
 * @param fileTree - A file tree
 * @param config - Configuration options
 */
export function useHotkeys(fileTree: FileTree, config: UseHotkeysConfig) {
  const {
    nodes,
    windowRef,
    rovingFocus,
    selections,
    querySelectorPattern = `[data-exploration-index="{index}"]`,
  } = config;
  const visibleNodes_ = useVisibleNodes(fileTree);
  const visibleNodes = nodes ?? visibleNodes_;

  function getSelectedId() {
    const rovingId = rovingFocus.didChange.getState();
    return rovingId > -1 ? rovingId : selections.tail ?? -1;
  }

  function getSelectedIndex() {
    return visibleNodes.indexOf(getSelectedId());
  }

  // @ts-expect-error: `window` isn't explicitly allowed but it works
  useHotkeys_(windowRef, [
    [
      "up",
      (event) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        event.preventDefault();
        const selectedIndex = getSelectedIndex();
        const nextSelector = querySelectorPattern.replace(
          "{index}",
          `${Math.max(selectedIndex - 1, 0)}`
        );

        const element = document.querySelector(nextSelector);

        if (element instanceof HTMLElement) {
          element.focus();
        }
      },
    ],

    [
      "down",
      (event) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        event.preventDefault();
        const selectedIndex = getSelectedIndex();
        const nextSelector = querySelectorPattern.replace(
          "{index}",
          `${Math.min(selectedIndex + 1, visibleNodes.length)}`
        );

        const element = document.querySelector(nextSelector);

        if (element instanceof HTMLElement) {
          element.focus();
        }
      },
    ],

    [
      "right",
      async (event) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        event.preventDefault();
        const nodeId = getSelectedId();
        const selectedIndex = getSelectedIndex();
        const node = fileTree.getById(nodeId);

        if (node && isDir(node)) {
          if (!fileTree.isExpanded(node)) {
            await fileTree.expand(node);
          } else if (fileTree.isVisible(node) && node.nodes?.length) {
            const element = document.querySelector(
              querySelectorPattern.replace(
                "{index}",
                `${Math.min(selectedIndex + 1, visibleNodes.length)}`
              )
            );

            if (element instanceof HTMLElement) {
              element.focus();
            }
          }
        }
      },
    ],

    [
      "left",
      (event) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        event.preventDefault();
        const nodeId = getSelectedId();
        const node = fileTree.getById(nodeId);

        if (node && isDir(node)) {
          if (node.expanded) {
            fileTree.collapse(node);
            return;
          }
        }

        if (node && node.parent) {
          const parentIndex = visibleNodes.indexOf(node.parent.id);
          const element = document.querySelector(
            querySelectorPattern.replace("{index}", parentIndex + "")
          );

          if (element instanceof HTMLElement) {
            element.focus();
          }
        }
      },
    ],

    [
      "space",
      (event) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        event.preventDefault();
        const nodeId = getSelectedId();
        const selectedIndex = getSelectedIndex();

        if (selectedIndex > -1) {
          const element = document.querySelector(
            querySelectorPattern.replace("{index}", selectedIndex + "")
          );

          if (element instanceof HTMLElement) {
            element.focus();
          }

          const node = fileTree.getById(nodeId);

          if (node) {
            if (isDir(node)) {
              if (node.expanded) {
                fileTree.collapse(node);
              } else {
                retryWithBackoff(() => fileTree.expand(node), {
                  shouldRetry() {
                    return node.expanded && !fileTree.isExpanded(node);
                  },
                }).catch(() => {});
              }
            } else {
              selections.clear();
              selections.select(nodeId);
            }
          }
        }
      },
    ],

    [
      "home",
      (event) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        event.preventDefault();
        const element = document.querySelector(
          querySelectorPattern.replace("{index}", "0")
        );

        if (element instanceof HTMLElement) {
          element.focus();
        }
      },
    ],

    [
      "end",
      (event) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        event.preventDefault();
        const element = document.querySelector(
          querySelectorPattern.replace("{index}", visibleNodes.length - 1 + "")
        );

        if (element instanceof HTMLElement) {
          element.focus();
        }
      },
    ],

    [
      "escape",
      (event) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        event.preventDefault();
        const rovingId = rovingFocus.didChange.getState();
        const selectedIndex = visibleNodes.indexOf(rovingId);

        if (rovingId > -1) {
          rovingFocus.didChange.setState(-1);
        }

        selections.clear();

        if (selectedIndex > -1) {
          const element = document.querySelector(
            querySelectorPattern.replace("{index}", selectedIndex + "")
          );

          if (element instanceof HTMLElement) {
            element.blur();

            if (windowRef && "current" in windowRef) {
              windowRef.current?.focus();
            } else if (windowRef) {
              windowRef.focus();
            }
          }
        }
      },
    ],
  ]);
}

export interface UseHotkeysConfig {
  /**
   * When using a hook like `useFilter` you can supply the filtered list of
   * nodes to this option. By default, `useVirtualize()` uses the nodes returned
   * by `useVisibleNodes()`
   */
  nodes?: number[];
  /**
   * A React ref created by useRef() or an HTML element for the container viewport
   * you're rendering the list inside of.
   */
  windowRef: WindowRef;
  /**
   * The returned value of the `useRovingFocus()` plugin
   */
  rovingFocus: ReturnType<typeof useRovingFocus>;
  /**
   * The returned value of the `useSelections()` plugin
   */
  selections: ReturnType<typeof useSelections>;
  /**
   * A pattern to use for selecting the elements in the list. Must contain an
   * `{index}` placeholder for the index of the element to select.
   */
  querySelectorPattern?: string;
}
