<hr/>

# exploration

> Primitives for creating high performance file explorers with React

```sh
npm i exploration
```

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

---

## Features

- [x] Zero-recursion, expandable tree
- [x] Virtualization
- [x] Create/move/rename/delete
- [x] Drag and drop
- [x] Hotkeys
- [x] Multiselect
- [x] Traits (e.g. add class names to selections, focused elements, etc.)
- [x] Filtering/search
- [x] Ready for React 18 concurrent mode

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

---

## Table of contents

### React API

| Name | Description |
| ---- | ----------- |

### Low-level API

| Name | Description |
| ---- | ----------- |

### Path utilities

| Name | Description |
| ---- | ----------- |

---

## API

### createFileTree()

#### Arguments

| Name     | Type | Required? | Description |
| -------- | ---- | --------- | ----------- |
| getNodes |      | Yes       |             |
| config   |      | No        |             |

#### [⇗ Back to top](#table-of-contents)

---

### useVirtualize()

A hook similar to `react-window`'s [`FixesSizeList`](https://react-window.vercel.app/#/examples/list/fixed-size)
component. It allows you to render only enough components to fill a viewport, solving
some important performance bottlenecks when rendering large lists.

#### Arguments

| Name     | Type                                          | Required? | Description           |
| -------- | --------------------------------------------- | --------- | --------------------- |
| fileTree | `FileTree<Meta>`                              | Yes       | A file tree           |
| config   | [`UseVirtualizeConfig`](#usevirtualizeconfig) | Yes       | Configuration options |

### UseVirtualizeConfig

| Name           | Type             | Required? | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------- | ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| windowRef      | `WindowRef`      | Yes       | A React ref created by useRef() or an HTML element for the container viewport you're rendering the list inside of.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| nodeHeight     | `number`         | Yes       | The fixed height (in px) of each node in your list.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| nodeGap        | `number`         | No        | Optionally set a gap (in px) between each node in your list.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| nodes          | `number[]`       | No        | When using a hook like `useFilter` you can supply the filtered list of nodes to this option. By default, `useVirtualize()` uses the nodes returned by `useVisibleNodes()`                                                                                                                                                                                                                                                                                                                                                                               |
| overscanBy     | `number`         | No        | This number is used for determining the number of nodes outside of the visible window to render. The default value is 2 which means "render 2 windows worth (2 \* height) of content before and after the items in the visible window". A value of 3 would be 3 windows worth of grid cells, so it's a linear relationship. Overscanning is important for preventing tearing when scrolling through items in the grid, but setting too high of a value may create too much work for React to handle, so it's best that you tune this value accordingly. |
| ResizeObserver | `ResizeObserver` | No        | This hook uses a [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) for tracking the size of the viewport. If you need to polyfill ResizeObserver you can provide that polyfill here. By default, we use the `ResizeObserver` from the `window` global.                                                                                                                                                                                                                                                                |

### Returns `UseVirtualizeResult`

````ts
export interface UseVirtualizeResult<Meta> {
  /**
   * The current scroll position of the viewport
   */
  scrollTop: number;
  /**
   * `true` if the viewport is currently scrolling
   */
  isScrolling: boolean;
  /**
   * Scroll to a given node by its ID
   * @param nodeId - The node ID to scroll to
   * @param config - Configuration options
   */
  scrollToNode(nodeId: number, config?: ScrollToNodeConfig): void;
  /**
   * Props that should be applied to the container you're mapping your virtualized
   * nodes into.
   *
   * @example
   * ```tsx
   * const windowRef = React.useRef(null)
   * const virtualize = useVirtualize(fileTree, {windowRef, nodeHeight: 24})
   * return (
   *   <div ref={windowRef} className='file-tree'>
   *     <div className='file-tree-container' {...virtualize.props}>
   *      {virtualize.map(props => <Node {...props}/>)}
   *     </div>
   *   </div>
   * )
   * ```
   */
  props: VirtualizeContainerProps;
  /**
   * Calls a defined render function on each node and returns an array that
   * contains the resulting React elements.
   *
   * @param render - A callback that renders a node.
   * @example
   * ```tsx
   * const windowRef = React.useRef(null)
   * const virtualize = useVirtualize(fileTree, {windowRef, nodeHeight: 24})
   * return (
   *   <div ref={windowRef} className='file-tree'>
   *     <div className='file-tree-container' {...virtualize.props}>
   *      {virtualize.map(props => <Node {...props}/>)}
   *     </div>
   *   </div>
   * )
   * ```
   */
  map(
    render: (config: VirtualizeRenderProps<Meta>) => React.ReactElement
  ): React.ReactElement[];
}

export interface VirtualizeRenderProps<Meta> {
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
````

#### [⇗ Back to top](#table-of-contents)

---

### &lt;Node&gt;

A React component that renders a node in a file tree with plugins. This can be directly
paired with the [`useVirtualize()`](#usevirtualize) hook.

#### Props

| Name     | Type                  | Required? | Description                                                      |
| -------- | --------------------- | --------- | ---------------------------------------------------------------- |
| node     | `FileTreeNode<Meta>`  | Yes       | A file tree node                                                 |
| index    | `number`              | Yes       | The index of the node within the file tree list of visible nodes |
| tree     | `FileTree<Meta>`      | Yes       | The file tree that contains the node                             |
| style    | `React.CSSProperties` | Yes       | Styles to apply to the `<div>` element                           |
| children | `React.ReactNode`     | Yes       | Children to render within the node                               |

#### [⇗ Back to top](#table-of-contents)

---

### useVisibleNodes()

A hook that subscribes to updates to the file tree and returns the nodes that
are currently visible in the file tree.

#### Arguments

| Name     | Type             | Required? | Description |
| -------- | ---------------- | --------- | ----------- |
| fileTree | `FileTree<Meta>` | Yes       | A file tree |

#### [⇗ Back to top](#table-of-contents)

---

### useNodePlugins()

A hook that subscribes to plugins and retrieves props that should be applied
to a given node. An example of a plugin wouuld be the `useTraits()` hook. The
`<Node>` component uses this under the hood.

#### Arguments

| Name    | Type                          | Required? | Description                                      |
| ------- | ----------------------------- | --------- | ------------------------------------------------ |
| nodeId  | `number`                      | Yes       | The node ID used to retrieve props from a plugin |
| plugins | [`NodePlugin[]`](#nodeplugin) | Yes       | A list of file tree plugins                      |

### NodePlugin

```ts
type NodePlugin<T = unknown> = {
  /**
   * An observable that the `useNodePlugins()` hook will subscribe to.
   */
  didChange: Observable<T>;
  /**
   * A function that returns React props based on a node ID.
   *
   * @param nodeId - The ID of a node in the file tree.
   */
  getProps(nodeId: number): React.HTMLAttributes<HTMLElement>;
};
```

#### [⇗ Back to top](#table-of-contents)

---

### useFilter()

A hook that returns filtered visible nodes based on a filter function.

#### Arguments

| Name     | Type                                                         | Required? | Description                                                                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fileTree | `FileTree<Meta>`                                             | Yes       | A file tree                                                                                                                                                                                                                                                                         |
| filter   | `((node: FileTreeNode<Meta>, i: number) => boolean) \| null` | Yes       | A _stable_ callback (e.g. `useCallback(() => {}, []))` that returns `true` if the node should be visible. This needs to be memoized or hoisted to the top level to ensure the filtered nodes only get re-generated when the filter changes or the file tree's visible nodes change. |

#### [⇗ Back to top](#table-of-contents)

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
```

#### [⇗ Back to top](#table-of-contents)

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
export interface UseSelectionsPlugin {
  /**
   * An observable that you can use to subscribe to changes to selections.
   */
  didChange: Observable<Set<number>>;
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
}
```

#### [⇗ Back to top](#table-of-contents)

---

### useDnd()

A plugin hook for adding drag and drop to the file tree.

#### Arguments

| Name     | Type             | Required? | Description                                         |
| -------- | ---------------- | --------- | --------------------------------------------------- |
| fileTree | `FileTree<Meta>` | Yes       | A file tree                                         |
| config   | `UseDndConfig`   | No        | A configuration object for the drag and drop plugin |

#### Returns `UseDndPlugin`

```ts
interface UseDndPlugin {
  /**
   * An observable that emits drag 'n drop events.
   */
  didChange: Observable<DndEvent<any> | null>;
  /**
   * Get the drag 'n drop props for a given node ID.
   */
  getProps: (nodeId: number) => DndProps | React.HTMLAttributes<HTMLElement>;
}
```

#### [⇗ Back to top](#table-of-contents)

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
   * An observable that you can use to subscribe to changes to the focused node.
   */
  didChange: Observable<number>;
  /**
   * Get the React props for a given node ID.
   *
   * @param nodeId - A node ID
   */
  getProps: (nodeId: number) => RovingFocusProps;
}
```

#### [⇗ Back to top](#table-of-contents)

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

#### [⇗ Back to top](#table-of-contents)

---

### useObservable()

A hook for subscribing to changes to the value of an observable.

#### Arguments

| Name       | Type                                 | Required? | Description                                            |
| ---------- | ------------------------------------ | --------- | ------------------------------------------------------ |
| observable | `Observable`                         | Yes       | An [observable](#observable)                           |
| onChange   | `(value: T) => void \| (() => void)` | Yes       | A callback that is invoked when the observable changes |

#### [⇗ Back to top](#table-of-contents)

---

## Low-level API

### FileTree()

#### Arguments

| Name | Type | Required? | Description |
| ---- | ---- | --------- | ----------- |
|      |      |           |             |

#### [⇗ Back to top](#table-of-contents)

---

### Dir()

#### Arguments

| Name | Type | Required? | Description |
| ---- | ---- | --------- | ----------- |
|      |      |           |             |

#### [⇗ Back to top](#table-of-contents)

---

### File()

#### Arguments

| Name | Type | Required? | Description |
| ---- | ---- | --------- | ----------- |
|      |      |           |             |

#### [⇗ Back to top](#table-of-contents)

---

### isDir()

#### Arguments

| Name | Type | Required? | Description |
| ---- | ---- | --------- | ----------- |
|      |      |           |             |

#### [⇗ Back to top](#table-of-contents)

---

### isFile()

#### Arguments

| Name | Type | Required? | Description |
| ---- | ---- | --------- | ----------- |
|      |      |           |             |

#### [⇗ Back to top](#table-of-contents)

---

### observable()

A utility for emitting abd subscribing to changes to a value.

#### Arguments

| Name         | Type | Required? | Description                          |
| ------------ | ---- | --------- | ------------------------------------ |
| initialValue | `T`  | Yes       | The initial value of the observable. |

#### Returns `Observable`

```ts
type Observable<T> = {
  /**
   * Emit a new value.
   *
   * @param value - The new value
   */
  next(value: T): void;
  /**
   * Get the current value.
   */
  getSnapshot(): T;
  /**
   * Subscribe to changes to the value.
   *
   * @param callback - A callback that is invoked when the value changes
   */
  subscribe(callback: (value: T) => void): () => void;
};
```

#### [⇗ Back to top](#table-of-contents)

---

### mergeProps()

Merges multiple props objects together. Event handlers are chained, classNames are
combined, and styles are combined.

For all other props, the last prop object overrides all previous ones.

#### Arguments

| Name | Type                      | Required? | Description                               |
| ---- | ------------------------- | --------- | ----------------------------------------- |
| args | `{[key: string]: any;}[]` | Yes       | Multiple sets of props to merge together. |

#### [⇗ Back to top](#table-of-contents)

---

## Path utilities

### pathFx.join()

Join all arguments together and normalize the resulting path.

#### Arguments

| Name  | Type       | Required? | Description   |
| ----- | ---------- | --------- | ------------- |
| paths | `string[]` | Yes       | Paths to join |

#### [⇗ Back to top](#table-of-contents)

---

### pathFx.relative()

Solve the relative path from `from` to `to`. Paths must be absolute.

#### Arguments

| Name | Type     | Required? | Description                     |
| ---- | -------- | --------- | ------------------------------- |
| from | `string` | Yes       | The absolute path to start from |
| to   | `string` | Yes       | The absolute path to solve to   |

#### [⇗ Back to top](#table-of-contents)

---

### pathFx.split()

Splits a path into an array of path segments.

#### Arguments

| Name | Type     | Required? | Description        |
| ---- | -------- | --------- | ------------------ |
| path | `string` | Yes       | The path to split. |

#### [⇗ Back to top](#table-of-contents)

---

### pathFx.normalize()

Normalize a path, taking care of `..` and `.`, and removing redundant slashes.
Unlike Node's `path`, this removes any trailing slashes.

#### Arguments

| Name | Type     | Required? | Description            |
| ---- | -------- | --------- | ---------------------- |
| path | `string` | Yes       | The path to normalize. |

#### [⇗ Back to top](#table-of-contents)

---

### pathFx.depth()

Get the depth of a path.

#### Arguments

| Name | Type     | Required? | Description        |
| ---- | -------- | --------- | ------------------ |
| path | `string` | Yest      | The path to split. |

#### [⇗ Back to top](#table-of-contents)

---

### pathFx.basename()

Return the last fragment of a path.

#### Arguments

| Name | Type     | Required? | Description                      |
| ---- | -------- | --------- | -------------------------------- |
| path | `string` | Yes       | The path to get the basename of. |

#### [⇗ Back to top](#table-of-contents)

---

### pathFx.dirname()

Return the directory name of a path.

#### Arguments

| Name | Type     | Required? | Description                            |
| ---- | -------- | --------- | -------------------------------------- |
| path | `string` | Yes       | The path to get the directory name of. |

#### [⇗ Back to top](#table-of-contents)

---

### pathFx.extname()

Returns the extension of a file path, which is the part of the path after the last `.`.
If the path has no extension, returns an empty string.

#### Arguments

| Name | Type     | Required? | Description                       |
| ---- | -------- | --------- | --------------------------------- |
| path | `string` | Yes       | The path to get the extension of. |

#### [⇗ Back to top](#table-of-contents)

---

### pathFx.isRelative()

Returns `true` if the path is relative.

#### Arguments

| Name | Type     | Required? | Description        |
| ---- | -------- | --------- | ------------------ |
| path | `string` | Yes       | The path to check. |

#### [⇗ Back to top](#table-of-contents)

---

### pathFx.isPathInside()

Returns `true` if `path` is inside `dir`.

#### Arguments

| Name | Type     | Required? | Description                                     |
| ---- | -------- | --------- | ----------------------------------------------- |
| path | `string` | Yes       | The path to check                               |
| dir  | `string` | Yes       | The directory to check if the path is inside of |

#### [⇗ Back to top](#table-of-contents)

---

### pathFx.removeTrailingSlashes()

Remove any trailing slashes from a path.

#### Arguments

| Name | Type     | Required? | Description                               |
| ---- | -------- | --------- | ----------------------------------------- |
| path | `string` | Yes       | The path to remove trailing slashes from. |

#### [⇗ Back to top](#table-of-contents)

---

## LICENSE

MIT
