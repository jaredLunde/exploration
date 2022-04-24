import { createStyles } from "@dash-ui/styles";
import reset from "@dash-ui/reset";
import {
  createFileTree,
  isDir,
  isFile,
  Node,
  useDnd,
  useHotkeys,
  useObserver,
  useRovingFocus,
  useSelections,
  useTraits,
  useVirtualize,
} from "exploration";
import React from "react";

const tree = createFileTree(getNodesFromMockFs);

export default function App() {
  const windowRef = React.useRef<HTMLElement | null>(null);
  const rovingFocus = useRovingFocus(tree);
  const selections = useSelections(tree);
  const traits = useTraits(tree, ["selected", "focused", "drop-target"]);
  const dnd = useDnd(tree);
  const virtualize = useVirtualize(tree, { windowRef, nodeHeight: 24 });

  useHotkeys(tree, { windowRef, rovingFocus, selections });

  useObserver(selections.didChange, (value) => {
    const selected = Array.from(value);
    traits.set("selected", selected);

    if (selected.length === 1) {
      const node = tree.getById(selected[0]);

      if (node && isFile(node)) {
        console.log("Opening file:", node.data.name);
      }
    }
  });

  useObserver(dnd.didChange, (event) => {
    if (!event) return;

    if (event.type === "enter" || event.type === "expanded") {
      if (event.node.parentId === event.dir.id) {
        return traits.clear("drop-target");
      }

      const nodeIds: number[] = [event.dir.id];
      const nodes = [...(event.dir.nodes ?? [])];

      while (nodes.length) {
        const node = tree.getById(nodes.pop() ?? -1);

        if (node) {
          nodeIds.push(node.id);

          if (isDir(node) && node.nodes) {
            nodes.push(...node.nodes);
          }
        }
      }

      traits.set("drop-target", nodeIds);
    } else if (event.type === "drop") {
      traits.clear("drop-target");
      const selected = selections.didChange.getState();

      if (selected.has(event.dir.id)) {
        return;
      }

      if (selected.has(event.node.id)) {
        const moveSelections = async () => {
          if (!tree.isVisible(event.dir)) {
            await tree.expand(event.dir);
          }

          for (const id of selected) {
            const node = tree.getById(id);

            if (node) {
              await tree.move(node, event.dir);
            }
          }
        };

        moveSelections();
        selections.clear();
      } else {
        tree.move(event.node, event.dir);
      }
    } else if (event.type === "end") {
      traits.clear("drop-target");
    }
  });

  useObserver(rovingFocus.didChange, (value) => {
    traits.set("focused", [value]);
  });

  return (
    <div>
      <main
        ref={windowRef}
        className={explorerStyles()}
        style={{ height: "100vh", width: "100%", overflow: "auto" }}
      >
        <div {...virtualize.props}>
          {virtualize.map((props) => {
            return (
              // eslint-disable-next-line react/jsx-key
              <Node plugins={[traits, rovingFocus, selections, dnd]} {...props}>
                {isDir(props.node) ? "📁" : ""} {props.node.basename}
              </Node>
            );
          })}
        </div>
      </main>
    </div>
  );
}

const styles = createStyles({});
const explorerStyles = styles.one({
  ...[...Array(20).keys()].reduce((acc, depth) => {
    acc[`.depth-${depth}`] = {
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: "transparent",
      paddingLeft: `${depth * 16}px`,
    };

    return acc;
  }, {}),

  ".selected": {
    color: "#0f6ab4",
  },

  ".focused": {
    borderColor: "rgba(0, 147, 184, 0.8)",
    backgroundColor: "rgba(0, 147, 184, 0.3)",
    outline: "none",
  },

  ".drop-target": {
    backgroundColor: "rgba(0, 147, 184, 0.2)",
  },
});

styles.insertGlobal(reset);
styles.insertGlobal({
  html: {
    fontFamily: "system-ui, sans-serif",
  },
});

function getNodesFromMockFs(parent: any, { createFile, createDir }: any) {
  const mockFs = {
    "/": [
      { name: "/.github", type: "dir" },
      { name: "/.husky", type: "dir" },
      { name: "/src", type: "dir" },
      { name: "/test", type: "dir" },
      { name: "/types", type: "dir" },
      { name: "/.gitignore", type: "file" },
      { name: "/babel.config.js", type: "file" },
      { name: "/CODE_OF_CONDUCT.md", type: "file" },
      { name: "/CONTRIBUTING.md", type: "file" },
      { name: "/LICENSE", type: "file" },
      { name: "/package.json", type: "file" },
      { name: "/pnpm-lock.yaml", type: "file" },
      { name: "/README.md", type: "file" },
      { name: "/tsconfig.json", type: "file" },
    ],
    "/.github": [
      { name: "/.github/ISSUE_TEMPLATE.md", type: "file" },
      { name: "/.github/PULL_REQUEST_TEMPLATE.md", type: "file" },
    ],
    "/.husky": [{ name: "/.husky/hooks", type: "dir" }],
    "/.husky/hooks": [{ name: "/.husky/hooks/pre-commit", type: "file" }],
    "/src": [
      { name: "/src/tree", type: "dir" },
      { name: "/src/index.ts", type: "file" },
      { name: "/src/file-tree.ts", type: "file" },
      { name: "/src/path-fx.ts", type: "file" },
    ],
    "/src/tree": [
      { name: "/src/tree/tree.ts", type: "file" },
      { name: "/src/tree/tree.test.ts", type: "file" },
    ],
    "/test": [
      { name: "/test/resolve-snapshot.js", type: "file" },
      { name: "/test/setup.ts", type: "file" },
    ],
    "/types": [
      { name: "/types/index.d.ts", type: "file" },
      { name: "/types/file-tree.d.ts", type: "file" },
      { name: "/types/path-fx.d.ts", type: "file" },
      { name: "/types/tree", type: "dir" },
    ],
    "/types/tree": [{ name: "/types/tree/tree.d.ts", type: "file" }],
  };

  return Promise.resolve(
    mockFs[parent.data.name].map((stat) => {
      if (stat.type === "file") {
        return createFile({ name: stat.name });
      }

      return createDir({ name: stat.name });
    })
  );
}
