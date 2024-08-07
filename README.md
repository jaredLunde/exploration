<hr/>

# Exploration

Primitives for creating high performance file explorers with React

```sh
npm i exploration
```

<a href="https://flexstack.com"><img src="https://flexstack.com/images/supported-by-flexstack.svg" height="32" alt="Supported by FlexStack"></a>
    
<hr>

<p>
  <a href="https://bundlephobia.com/result?p=exploration">
    <img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/exploration?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Types" href="https://www.npmjs.com/package/exploration">
    <img alt="Types" src="https://img.shields.io/npm/types/exploration?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Code coverage report" href="https://codecov.io/gh/jaredLunde/exploration">
    <img alt="Code coverage" src="https://img.shields.io/codecov/c/gh/jaredLunde/exploration?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/exploration">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/exploration?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="License" href="https://jaredlunde.mit-license.org/">
    <img alt="MIT License" src="https://img.shields.io/npm/l/exploration?style=for-the-badge&labelColor=24292e">
  </a>
</p>

## Features

- [x] **Zero-recursion**, expandable tree
- [x] **Virtualization**, only render what is visible
- [x] **Create/delete/move/rename** actions
- [x] **Drag and drop**
- [x] **Hotkeys**
- [x] **Multiselect**
- [x] **Traits**, add class names to selections, focused elements, anything
- [x] **Filtering/search**
- [x] **Tree snapshot restoration** for persisting the expanded state of the tree between refreshes
- [x] **Strongly typed** so you can engineer with confidence
- [x] **Concurrent mode** safe, ready for React 18

---

## The problem

File explorers in React tend to be large, slow, and opinionated. They usually peter out at a
hundred nodes and aren't suitable for building a complex file explorer in the browser. Other
solutions like [Aspen](https://github.com/zikaari/aspen) aimed to solve this problem by
using typed arrays (which don't seem to offer much benefit in performance) and event-driven models.
They did a pretty job, however, the documentation was sparse and the code was verbose. All that said,
Aspen and Monaco's tree were huge inspirations.

## The solution

With this library I tried to solve all of those problems. It's built on plain JavaScript arrays,
well-designed data structures, an event-driven model, and concurrent mode-safe React hooks. It
does just enough to be extremely powerful without being opinionated about styles, hotkeys, or
traits. It's also performant enough to be used in browser integrated development environments.
It makes sure React only renders what changes without render thrashing.

Most importantly - it's easy to use. So check out the recipes below and give it a try!

---

## Recipes

> ☀︎ Coming soon

1. [**How to create a new file or directory to the tree**](#)
1. [**How to delete a file or directory from the tree**](#)
1. [**How to rename a file**](#)
1. [**How to implement drag 'n drop with multiselect**](#)
1. [**How to add traits to files/directories**](#)
1. [**How to add your own hotkeys**](#)
1. [**How to do perfom an action when a file is selected (opened)**](#)
1. [**How to filter the list of visible files/directories**](#)
1. [**How to write your own file tree plugin**](#)
1. [**How to restore the state of the file tree from local storage**](#)

---

## React API

### createFileTree()

Create a file tree that can be used with the React API.

#### Arguments

| Name     | Type                          | Required? | Description                                         |
| -------- | ----------------------------- | --------- | --------------------------------------------------- |
| getNodes | [`GetNodes<Meta>`](#getnodes) | Yes       | A function that returns the nodes of the file tree. |
| config   | `FileTreeConfig<Meta>`        | No        | Configuration options for the file tree.            |

#### GetNodes

```ts
type GetNodes<Meta> = {
  /**
   * Get the nodes for a given directory
   *
   * @param parent - The parent directory to get the nodes for
   * @param factory - A factory to create nodes (file/dir) with
   */
  (parent: Dir<Meta>, factory: Omit<FileTreeFactory<Meta>, "createPrompt">):
    | Promise<FileTreeNode<Meta>[]>
    | FileTreeNode<Meta>[];
};
```

#### FileTreeConfig

```ts
type FileTreeConfig<Meta> = {
  /**
   * A function that compares two nodes for sorting.
   */
  comparator?: FileTree["comparator"];
  /**
   * The root node data
   */
  root?: Omit<FileTreeData<Meta>, "type">;
  /**
   * Restore the tree from a snapshot
   */
  restoreFromSnapshot?: FileTreeSnapshot;
};
```

#### Returns [`FileTree`](#filetree)

[**⇗ Back to top**](#exploration)

---

### useVirtualize()

A hook similar to `react-window`'s [`FixedSizeList`](https://react-window.vercel.app/#/examples/list/fixed-size)
component. It allows you to render only enough components to fill a viewport, solving
some important performance bottlenecks when rendering large lists.

#### Arguments

| Name     | Type                                          | Required? | Description           |
| -------- | --------------------------------------------- | --------- | --------------------- |
| fileTree | `FileTree<Meta>`                              | Yes       | A file tree           |
| config   | [`UseVirtualizeConfig`](#usevirtualizeconfig) | Yes       | Configuration options |

#### UseVirtualizeConfig

| Name           | Type             | Required? | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------- | ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| windowRef      | `WindowRef`      | Yes       | A React ref created by useRef() or an HTML element for the container viewport you're rendering the list inside of.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| nodeHeight     | `number`         | Yes       | The fixed height (in px) of each node in your list.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| nodeGap        | `number`         | No        | Optionally set a gap (in px) between each node in your list.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| nodes          | `number[]`       | No        | When using a hook like `useFilter` you can supply the filtered list of nodes to this option. By default, `useVirtualize()` uses the nodes returned by `useVisibleNodes()`                                                                                                                                                                                                                                                                                                                                                                               |
| overscanBy     | `number`         | No        | This number is used for determining the number of nodes outside of the visible window to render. The default value is 2 which means "render 2 windows worth (2 \* height) of content before and after the items in the visible window". A value of 3 would be 3 windows worth of grid cells, so it's a linear relationship. Overscanning is important for preventing tearing when scrolling through items in the grid, but setting too high of a value may create too much work for React to handle, so it's best that you tune this value accordingly. |
| ResizeObserver | `ResizeObserver` | No        | This hook uses a [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) for tracking the size of the viewport. If you need to polyfill ResizeObserver you can provide that polyfill here. By default, we use the `ResizeObserver` from the `window` global.                                                                                                                                                                                                                                                                |

#### Returns `UseVirtualizeResult`

```ts
interface UseVirtualizeResult<Meta> {
  /**
   * The current scroll position of the viewport
   */
  scrollTop: number;
  /**
   * `true` if the viewport is currently scrolling
   */
  isScrolling: boolean;
  /**
   * Scroll to the viewport a given position
   * @param scrollTop - The new scroll position
   * @param config - Configuration options
   */
  scrollTo(
    scrollTop: number,
    config: Pick<ScrollToNodeConfig, "behavior">
  ): void;
  /**
   * Scroll to a given node by its ID
   * @param nodeId - The node ID to scroll to
   * @param config - Configuration options
   */
  scrollToNode(nodeId: number, config?: ScrollToNodeConfig): void;
  /**
   * Props that should be applied to the container you're mapping your virtualized
   * nodes into.
   */
  props: VirtualizeContainerProps;
  /**
   * Calls a defined render function on each node and returns an array that
   * contains the resulting React elements.
   *
   * @param render - A callback that renders a node.
   */
  map(
    render: (config: VirtualizeRenderProps<Meta>) => React.ReactElement
  ): React.ReactElement[];
}

interface VirtualizeRenderProps<Meta> {
  /**
   * A stable key as required by React elements that are included in arrays
   */
  key: number;
  /**
   * The index of the node within the list of visible nodes
   */
  index: number;
  /**
   * A file tree node
   */
  node: FileTreeNode<Meta>;
  /**
   * The file tree that contains the node
   */
  tree: FileTree<Meta>;
  /**
   * Styles that need to be applied to the node element
   */
  style: React.CSSProperties;
}
```

[**⇗ Back to top**](#exploration)

---

### &lt;Node&gt;

A React component that renders a node in a file tree with plugins. This can be directly
paired with the [`useVirtualize()`](#usevirtualize) hook.

#### Node Props

| Name     | Type                                                     | Required? | Description                                                      |
| -------- | -------------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| as       | `React.ComponentType<React.HTMLAttributes<HTMLElement>>` | No        | Render the node as this component. Defaults to `"div"`.          |
| node     | `FileTreeNode<Meta>`                                     | Yes       | A file tree node                                                 |
| index    | `number`                                                 | Yes       | The index of the node within the file tree list of visible nodes |
| tree     | `FileTree<Meta>`                                         | Yes       | The file tree that contains the node                             |
| style    | `React.CSSProperties`                                    | Yes       | Styles to apply to the `<div>` element                           |
| children | `React.ReactNode`                                        | Yes       | Children to render within the node                               |

[**⇗ Back to top**](#exploration)

---

### useNode()

A plugin that creates and memoizes node-specific props.

#### Arguments

| Name     | Type                                                  | Required? | Description                                  |
| -------- | ----------------------------------------------------- | --------- | -------------------------------------------- |
| fileTree | `FileTree<Meta>`                                      | Yes       | A file tree                                  |
| config   | `Pick<NodeProps<Meta>, "node" \| "index" \| "style">` | Yes       | Options to generate node-specific props from |

---

### useVisibleNodes()

A hook that observes to updates to the file tree and returns the nodes that
are currently visible in the file tree.

#### Arguments

| Name     | Type             | Required? | Description |
| -------- | ---------------- | --------- | ----------- |
| fileTree | `FileTree<Meta>` | Yes       | A file tree |

[**⇗ Back to top**](#exploration)

---

### useNodePlugins()

A hook that observes to plugins and retrieves props that should be applied
to a given node. An example of a plugin wouuld be the `useTraits()` hook. The
`<Node>` component uses this under the hood.

#### Arguments

| Name    | Type                          | Required? | Description                                      |
| ------- | ----------------------------- | --------- | ------------------------------------------------ |
| nodeId  | `number`                      | Yes       | The node ID used to retrieve props from a plugin |
| plugins | [`NodePlugin[]`](#nodeplugin) | Yes       | A list of file tree plugins                      |

#### NodePlugin

```ts
type NodePlugin<T = unknown> = {
  /**
   * A subject that the `useNodePlugins()` hook will observe to.
   */
  didChange: Subject<T>;
  /**
   * A function that returns React props based on a node ID.
   *
   * @param nodeId - The ID of a node in the file tree.
   */
  getProps(nodeId: number): React.HTMLAttributes<HTMLElement>;
};
```

[**⇗ Back to top**](#exploration)

---

### useFilter()

A hook that returns filtered visible nodes based on a filter function.

#### Arguments

| Name     | Type                                                         | Required? | Description                                                                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fileTree | `FileTree<Meta>`                                             | Yes       | A file tree                                                                                                                                                                                                                                                                         |
| filter   | `((node: FileTreeNode<Meta>, i: number) => boolean) \| null` | Yes       | A _stable_ callback (e.g. `useCallback(() => {}, []))` that returns `true` if the node should be visible. This needs to be memoized or hoisted to the top level to ensure the filtered nodes only get re-generated when the filter changes or the file tree's visible nodes change. |

[**⇗ Back to top**](#exploration)

---

### useTraits()

A plugin hook that allows you to arbitrarily apply traits/decorations to nodes in the file
tree. For example, if you wanted to add a class name to a node in the tree if it were
selected, focused, et. al. you could use this hook to do that. Another example would
be the `M` modified decorations in VSCode.

#### Arguments

| Name     | Type             | Required? | Description                                               |
| -------- | ---------------- | --------- | --------------------------------------------------------- |
| fileTree | `FileTree<Meta>` | Yes       | A file tree                                               |
| traits   | `string[]`       | Yes       | The list of available traits that can be applied to nodes |

#### Returns `UseTraitsPlugin`

```ts
interface UseTraitsPlugin<Trait> {
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
```

[**⇗ Back to top**](#exploration)

---

### useSelections()

A plugin hook for adding select and multi-select to the file tree.

#### Arguments

| Name     | Type             | Required? | Description                                                                                                                                                               |
| -------- | ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fileTree | `FileTree<Meta>` | Yes       | A file tree                                                                                                                                                               |
| nodes    | `number[]`       | No        | When using a hook like `useFilter` you can supply the filtered list of nodes to this option. By default, `useVirtualize()` uses the nodes returned by `useVisibleNodes()` |

#### Returns `UseSelectionsPlugin`

```ts
interface UseSelectionsPlugin {
  /**
   * A subject that you can use to observe to changes to selections.
   */
  didChange: Subject<Set<number>>;
  /**
   * Get the React props for a given node ID.
   *
   * @param nodeId - A node ID
   */
  getProps(nodeId: number): SelectionsProps;
  /**
   * The head of the selections list
   */
  get head(): number | null;
  /**
   * The tail of the selections list
   */
  get tail(): number | null;
  /**
   * Select given node ids
   *
   * @param nodeIds - Node IDs
   */
  select(...nodeIds: number[]): void;
  /**
   * Deselect given node ids
   *
   * @param nodeIds - Node IDs
   */
  deselect(...nodeIds: number[]): void;
  /**
   * Clear all of the selections
   */
  clear(): void;
  /**
   * A utility function that yields nodes from a set of selections if they
   * don't have a parent node in the set.
   *
   * @yields {number} - A node id
   */
  narrow(): Generator<number, void, unknown>;
}
```

[**⇗ Back to top**](#exploration)

---

### useDnd()

A plugin hook for adding drag and drop to the file tree.

#### Arguments

| Name     | Type                            | Required? | Description                                         |
| -------- | ------------------------------- | --------- | --------------------------------------------------- |
| fileTree | `FileTree<Meta>`                | Yes       | A file tree                                         |
| config   | [`UseDndConfig`](#usedndconfig) | Yes       | A configuration object for the drag and drop plugin |

#### Returns `UseDndPlugin`

```ts
interface UseDndPlugin {
  /**
   * A subject that emits drag 'n drop events.
   */
  didChange: Subject<DndEvent<any> | null>;
  /**
   * Get the drag 'n drop props for a given node ID.
   */
  getProps: (nodeId: number) => DndProps | React.HTMLAttributes<HTMLElement>;
}
```

#### UseDndConfig

```ts
interface UseDndConfig {
  /**
   * Timeout for expanding a directory when a draggable element enters it.
   */
  dragOverExpandTimeout?: number;
  /**
   * A React ref created by useRef() or an HTML element for the container viewport
   * you're rendering the list inside of.
   */
  windowRef: WindowRef;
}
```

[**⇗ Back to top**](#exploration)

---

### useRovingFocus()

A plugin hook for adding roving focus to file tree nodes.

#### Arguments

| Name     | Type             | Required? | Description |
| -------- | ---------------- | --------- | ----------- |
| fileTree | `FileTree<Meta>` | Yes       | A file tree |

#### Returns `UseRovingFocusPlugin`

```ts
interface UseRovingFocusPlugin {
  /**
   * A subject that you can use to observe to changes to the focused node.
   */
  didChange: Subject<number>;
  /**
   * Get the React props for a given node ID.
   *
   * @param nodeId - A node ID
   */
  getProps: (nodeId: number) => RovingFocusProps;
}
```

[**⇗ Back to top**](#exploration)

---

### useHotkeys()

A hook for adding standard hotkeys to the file tree.

#### Arguments

| Name     | Type                                    | Required? | Description                                   |
| -------- | --------------------------------------- | --------- | --------------------------------------------- |
| fileTree | `FileTree<Meta>`                        | Yes       | A file tree                                   |
| config   | [`UseHotkeysConfig`](#usehotkeysconfig) | No        | A configuration object for the hotkeys plugin |

#### UseHotkeysConfig

```ts
interface UseHotkeysConfig {
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
```

[**⇗ Back to top**](#exploration)

---

### useObserver()

A hook for observing changes to the value of a subject.

#### Arguments

| Name     | Type                                 | Required? | Description                                         |
| -------- | ------------------------------------ | --------- | --------------------------------------------------- |
| subject  | `Subject`                            | Yes       | A [subject](#subject) to observe                    |
| observer | `(value: T) => void \| (() => void)` | Yes       | A callback that is invoked when the subject changes |

[**⇗ Back to top**](#exploration)

---

### useFileTreeSnapshot()

Take a snapshot of the expanded and buried directories of a file tree.
This snapshot can be used to restore the expanded/collapsed state of the
file tree when you initially load it.

#### Arguments

| Name     | Type                                                 | Required? | Description                                    |
| -------- | ---------------------------------------------------- | --------- | ---------------------------------------------- |
| fileTree | `FileTree<Meta>`                                     | Yes       | A file tree                                    |
| observer | `(state: FileTreeSnapshot) => Promise<void> \| void` | Yes       | A callback that handles the file tree snapshot |

[**⇗ Back to top**](#exploration)

---

## Low-level API

### FileTree()

#### Properties

| Name         | Type                 | Description                                    |
| ------------ | -------------------- | ---------------------------------------------- |
| root         | `number`             | The root directory of the file tree.           |
| comparator   | `Dir<Meta>`          | The comparator used for sorting the file tree. |
| visibleNodes | `FileTreeNode<Meta>` | The nodes that are currently visible.          |

#### Methods

| Name       | Description                                                                                                                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| getById    | Get a node by its ID.                                                                                                                                                                                                                                                                      |
| getByPath  | Get a node by its path. Note that this requires walking the tree, which has O(n) complexity.                                                                                                                                                                                               |
| walk       | Walks the tree starting at a given directory and calls a visitor function for each node.                                                                                                                                                                                                   |
| expand     | Expand a directory in the tree.                                                                                                                                                                                                                                                            |
| collapse   | Collapse a directory in the tree.                                                                                                                                                                                                                                                          |
| remove     | Remove a node and its descendants from the tree.                                                                                                                                                                                                                                           |
| invalidate | Invalidate the list of visible nodes. This is useful for re-rendering your tree when node data changes.                                                                                                                                                                                    |
| produce    | Produce a new tree with the given function applied to the given node. This is similar to `immer`'s produce function as you're working on a draft and can freely mutate the object.                                                                                                         |
| move       | Move a node to a new parent.                                                                                                                                                                                                                                                               |
| newFile    | Create a new file in a given directory.                                                                                                                                                                                                                                                    |
| newDir     | Create a new directory in a given directory.                                                                                                                                                                                                                                               |
| newPrompt  | Create a new prompt in a given directory.                                                                                                                                                                                                                                                  |
| rename     | Rename a node.                                                                                                                                                                                                                                                                             |
| isExpanded | A more accurate and real-time representation of whether a branch is expanded. `Dir#expanded` represents the "optimistic" expansion state of the branch in question not the actual status, because the child nodes might still need to be loaded before the change can be seen in the tree. |
| isVisible  | Returns `true` if the node and its parents are visible in the tree.                                                                                                                                                                                                                        |
| loadNodes  | You can use this method to manually trigger a reload of a directory in the tree.                                                                                                                                                                                                           |

#### FileTreeData<Meta>

```ts
type FileTreeData<Meta = {}> = {
  name: string;
  meta?: Meta;
};
```

[**⇗ Back to top**](#exploration)

---

### Dir()

A class for creating a directory node.

#### Arguments

| Name     | Type                                  | Required? | Description                                                                                                                                                                                                                     |
| -------- | ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| parent   | `Dir<Meta>`                           | Yes       | The parent node                                                                                                                                                                                                                 |
| data     | [`FileTreeData<Meta>`](#filetreedata) | Yes       | The node data                                                                                                                                                                                                                   |
| expanded | `boolean`                             | No        | Whether the node is expanded or not, defaults to `false`. This is an optimistic property, so when it is `true` its descendants may not be fully loaded yet. To get the more accurate representation, use `FileTree#isExpanded`. |

#### Properties

| Name     | Type                                  | Description                          |
| -------- | ------------------------------------- | ------------------------------------ |
| parentId | `number`                              | The ID of the parent node.           |
| parent   | `Dir<Meta>`                           | The parent node.                     |
| basename | `string`                              | The basename of the directory.       |
| path     | `string`                              | The full path of the directory.      |
| expanded | `boolean`                             | `true` if the directory is expanded. |
| data     | [`FileTreeData<Meta>`](#filetreedata) | The node data                        |

#### Methods

| Name     | Description                                                   |
| -------- | ------------------------------------------------------------- |
| contains | Returns `true` if the node is a descendant of this directory. |

[**⇗ Back to top**](#exploration)

---

### File()

A class for creating a file node.

#### Arguments

| Name   | Type                 | Required? | Description     |
| ------ | -------------------- | --------- | --------------- |
| parent | `Dir<NodeData>`      | Yes       | The parent node |
| data   | `FileTreeData<Meta>` | Yes       | The node data   |

#### Properties

| Name     | Type                 | Description                     |
| -------- | -------------------- | ------------------------------- |
| parentId | `number`             | The ID of the parent node.      |
| parent   | `Dir<Meta>`          | The parent node.                |
| basename | `string`             | The basename of the directory.  |
| path     | `string`             | The full path of the directory. |
| data     | `FileTreeData<Meta>` | The node data                   |

[**⇗ Back to top**](#exploration)

---

### Prompt()

A class for creating a prompt node.

#### Arguments

| Name   | Type            | Required? | Description     |
| ------ | --------------- | --------- | --------------- |
| parent | `Dir<NodeData>` | Yes       | The parent node |

#### Properties

| Name     | Type        | Description                                         |
| -------- | ----------- | --------------------------------------------------- |
| parentId | `number`    | The ID of the parent node.                          |
| parent   | `Dir<Meta>` | The parent node.                                    |
| path     | `string`    | The full path of the prompt.                        |
| basename | `string`    | The base name of prompts is always an empty string. |

[**⇗ Back to top**](#exploration)

---

### isDir()

Returns `true` if the given node is a directory

#### Arguments

| Name     | Type              | Required? | Description      |
| -------- | ----------------- | --------- | ---------------- |
| treeNode | `FileTreeNode<T>` | Yes       | A file tree node |

[**⇗ Back to top**](#exploration)

---

### isFile()

Returns `true` if the given node is a file

#### Arguments

| Name     | Type              | Required? | Description      |
| -------- | ----------------- | --------- | ---------------- |
| treeNode | `FileTreeNode<T>` | Yes       | A file tree node |

[**⇗ Back to top**](#exploration)

---

### isPrompt()

Returns `true` if the given node is a prompt

#### Arguments

| Name     | Type              | Required? | Description      |
| -------- | ----------------- | --------- | ---------------- |
| treeNode | `FileTreeNode<T>` | Yes       | A file tree node |

[**⇗ Back to top**](#exploration)

---

### subject()

A utility for creating a subject as part of the [observer pattern](https://en.wikipedia.org/wiki/Observer_pattern).

#### Arguments

| Name         | Type | Required? | Description                       |
| ------------ | ---- | --------- | --------------------------------- |
| initialState | `T`  | Yes       | The initial state of the subject. |

#### Returns `Subject`

```ts
export type Subject<T> = {
  /**
   * Emit a new state.
   *
   * @param state - The new state
   */
  setState(state: T): void;
  /**
   * Get the current state.
   */
  getState(): T;
  /**
   * Observe changes to the state.
   *
   * @param observer - A callback that is invoked when the value changes
   */
  observe(observer: Observer<T>): () => void;
  /**
   * Remove a observer from the list of observers
   *
   * @param observer - A callback that is invoked when the value changes
   */
  unobserve(observer: Observer<T>): void;
};

type Observer<T> = {
  (state: T): void;
};
```

[**⇗ Back to top**](#exploration)

---

### mergeProps()

Merges multiple props objects together. Event handlers are chained, classNames are
combined, and styles are combined.

For all other props, the last prop object overrides all previous ones.

#### Arguments

| Name | Type                      | Required? | Description                               |
| ---- | ------------------------- | --------- | ----------------------------------------- |
| args | `{[key: string]: any;}[]` | Yes       | Multiple sets of props to merge together. |

[**⇗ Back to top**](#exploration)

---

### retryWithBackoff()

Retry a promise until it resolves or the max number of retries is reached.

#### Arguments

| Name      | Type                                                | Required? | Description                                              |
| --------- | --------------------------------------------------- | --------- | -------------------------------------------------------- |
| promiseFn | `() => Promise<T>`                                  | Yes       | A function that returns a promise to retry when it fails |
| config    | [`RetryWithBackoffConfig`](#retrywithbackoffconfig) | No        | Configuration options                                    |

#### RetryWithBackoffConfig

```ts
interface RetryWithBackoffConfig {
  /**
   * Max number of retries
   *
   * @default 4
   */
  maxRetries?: number;
  /**
   * Initial delay before first retry
   *
   * @default 100
   */
  initialDelay?: number;
  /**
   * Multiplier for each subsequent retry
   *
   * @default 2
   */
  delayMultiple?: number;
  /**
   * A function that should return `false` to stop retrying
   *
   * @param error - The error that caused the retry
   */
  shouldRetry?: (error: unknown) => boolean;
}
```

[**⇗ Back to top**](#exploration)

---

## Path utilities

Utilities for unix-style paths

### pathFx.join()

Join all arguments together and normalize the resulting path.

#### Arguments

| Name  | Type       | Required? | Description   |
| ----- | ---------- | --------- | ------------- |
| paths | `string[]` | Yes       | Paths to join |

[**⇗ Back to top**](#exploration)

---

### pathFx.relative()

Solve the relative path from `from` to `to`. Paths must be absolute.

#### Arguments

| Name | Type     | Required? | Description                     |
| ---- | -------- | --------- | ------------------------------- |
| from | `string` | Yes       | The absolute path to start from |
| to   | `string` | Yes       | The absolute path to solve to   |

[**⇗ Back to top**](#exploration)

---

### pathFx.split()

Splits a path into an array of path segments.

#### Arguments

| Name | Type     | Required? | Description        |
| ---- | -------- | --------- | ------------------ |
| path | `string` | Yes       | The path to split. |

[**⇗ Back to top**](#exploration)

---

### pathFx.normalize()

Normalize a path, taking care of `..` and `.`, and removing redundant slashes while
preserving trailing slashes.

#### Arguments

| Name | Type     | Required? | Description            |
| ---- | -------- | --------- | ---------------------- |
| path | `string` | Yes       | The path to normalize. |

[**⇗ Back to top**](#exploration)

---

### pathFx.depth()

Get the depth of a path.

#### Arguments

| Name | Type     | Required? | Description        |
| ---- | -------- | --------- | ------------------ |
| path | `string` | Yest      | The path to split. |

[**⇗ Back to top**](#exploration)

---

### pathFx.basename()

Return the last fragment of a path.

#### Arguments

| Name | Type     | Required? | Description                      |
| ---- | -------- | --------- | -------------------------------- |
| path | `string` | Yes       | The path to get the basename of. |

[**⇗ Back to top**](#exploration)

---

### pathFx.dirname()

Return the directory name of a path.

#### Arguments

| Name | Type     | Required? | Description                            |
| ---- | -------- | --------- | -------------------------------------- |
| path | `string` | Yes       | The path to get the directory name of. |

[**⇗ Back to top**](#exploration)

---

### pathFx.extname()

Returns the extension of a file path, which is the part of the path after the last `.`.
If the path has no extension, returns an empty string.

#### Arguments

| Name | Type     | Required? | Description                       |
| ---- | -------- | --------- | --------------------------------- |
| path | `string` | Yes       | The path to get the extension of. |

[**⇗ Back to top**](#exploration)

---

### pathFx.isRelative()

Returns `true` if the path is relative.

#### Arguments

| Name | Type     | Required? | Description        |
| ---- | -------- | --------- | ------------------ |
| path | `string` | Yes       | The path to check. |

[**⇗ Back to top**](#exploration)

---

### pathFx.isPathInside()

Returns `true` if `path` is inside `dir`.

#### Arguments

| Name | Type     | Required? | Description                                     |
| ---- | -------- | --------- | ----------------------------------------------- |
| path | `string` | Yes       | The path to check                               |
| dir  | `string` | Yes       | The directory to check if the path is inside of |

[**⇗ Back to top**](#exploration)

---

### pathFx.removeTrailingSlashes()

Remove any trailing slashes from a path.

#### Arguments

| Name | Type     | Required? | Description                               |
| ---- | -------- | --------- | ----------------------------------------- |
| path | `string` | Yes       | The path to remove trailing slashes from. |

[**⇗ Back to top**](#exploration)

---

## LICENSE

MIT
