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
  <a aria-label="Build status" href="https://github.com/jaredLunde/exploration/actions/workflows/release.yml">
    <img alt="Build status" src="https://img.shields.io/github/workflow/status/jaredLunde/exploration/release/main?style=for-the-badge&labelColor=24292e">
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
- [x] Traits
- [x] Filtering/search

---

## Quick start

```tsx
import {
  createFileTree,
  useSelections,
  useDnd,
  useTraits,
  useFilter,
  useVirtualize,
} from "exploration";

const fileTree = createFileTree((parent, { createFile, createDir }) => {
  // Return the files that live at the current depth within the tree or a promise
  // containing the files at the current depth.
  return Promise.resolve([
    createDir({ name: "src" }),
    createFile({ name: "README.md" }),
  ]);
});

function FileExplorer() {
  const [searchValue, setSearchValue] = React.useState("");

  return (
    <div>
      <input
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />

      <Virtualize tree={tree} searchValue={searchValue} />
    </div>
  );
}

function Virtualize({
  tree,
  searchValue,
}: {
  tree: FileTree;
  searchValue: string;
}) {
  const windowRef = React.useRef(null);
  const dndProps = useDnd(fileTree);
  const decorations = useTraits(fileTree, [
    "active",
    "pseudo-active",
    "selected",
    "modified",
    "untracked",
  ]);
  const multiselect = useSelections(fileTree, (nodes) => {
    decorations.add("selected", ...nodes.map((node) => node.id));
  });
  const nodes = useFilter(
    fileTree,
    (node, i) => !searchValue || node.includes(searchValue)
  );
  const virtualize = useVirtualize(fileTree, {
    nodes,
    windowRef,
  });

  return (
    <div
      ref={windowRef}
      style={{ height: "100vh", padding: 8, width: "100%", overflow: "auto" }}
    >
      <div {...virtualize.props}>
        {virtualize.map((props) => {
          return (
            <Node plugins={[traits, rovingFocus, selections, dnd]} {...props}>
              {isDir(props.node) ? "📁" : ""} {props.node.basename}
            </Node>
          );
        })}
      </div>
    </div>
  );
}
```

## API

### someFunction()

#### Arguments

| Name | Type | Default | Required? | Description |
| ---- | ---- | ------- | --------- | ----------- |
|      |      |         |           |             |

## LICENSE

MIT
