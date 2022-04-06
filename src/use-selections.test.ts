import { act, renderHook } from "@testing-library/react-hooks";
import type { FileTree } from "./file-tree";
import { createFileTree } from "./file-tree";
import { useSelections } from "./use-selections";

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
    { name: "/test/resolve-snapshot.js" },
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

describe("useSelections()", () => {
  let fileTree = createFileTree(getNodesFromMockFs);

  afterEach(() => {
    fileTree = createFileTree(getNodesFromMockFs);
  });

  it("should select a single node", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useSelections(fileTree));

    act(() => {
      // @ts-expect-error
      result.current.getProps(fileTree.visibleNodes[0]).onClick({});
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([
      fileTree.visibleNodes[0],
    ]);
  });

  it("should select a single node with the handle", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useSelections(fileTree));

    act(() => {
      result.current.select(fileTree.visibleNodes[0]);
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([
      fileTree.visibleNodes[0],
    ]);
  });

  it("should deselect a single node with the handle", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useSelections(fileTree));

    act(() => {
      result.current.select(fileTree.visibleNodes[0]);
      result.current.deselect(fileTree.visibleNodes[0]);
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([]);
  });

  it("should clear selections", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useSelections(fileTree));

    act(() => {
      result.current.select(fileTree.visibleNodes[0]);
      result.current.clear();
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([]);
  });

  it("should select multiple nodes", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useSelections(fileTree));

    act(() => {
      // @ts-expect-error
      result.current.getProps(fileTree.visibleNodes[0]).onClick({});
      result.current
        .getProps(fileTree.visibleNodes[1])
        // @ts-expect-error
        .onClick({ metaKey: true });
      result.current
        .getProps(fileTree.visibleNodes[2])
        // @ts-expect-error
        .onClick({ metaKey: true });
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([
      fileTree.visibleNodes[0],
      fileTree.visibleNodes[1],
      fileTree.visibleNodes[2],
    ]);
  });

  it("should select multiple nodes followed by a single", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useSelections(fileTree));

    act(() => {
      // @ts-expect-error
      result.current.getProps(fileTree.visibleNodes[0]).onClick({});
      result.current
        .getProps(fileTree.visibleNodes[1])
        // @ts-expect-error
        .onClick({ metaKey: true });
      // @ts-expect-error
      result.current.getProps(fileTree.visibleNodes[2]).onClick({});
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([
      fileTree.visibleNodes[2],
    ]);
  });

  it("should select a range of nodes", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useSelections(fileTree));

    act(() => {
      // @ts-expect-error
      result.current.getProps(fileTree.visibleNodes[0]).onClick({});
      result.current
        .getProps(fileTree.visibleNodes[2])
        // @ts-expect-error
        .onClick({ shiftKey: true });
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([
      fileTree.visibleNodes[0],
      fileTree.visibleNodes[1],
      fileTree.visibleNodes[2],
    ]);

    act(() => {
      result.current
        .getProps(fileTree.visibleNodes[4])
        // @ts-expect-error
        .onClick({ shiftKey: true });
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([
      fileTree.visibleNodes[0],
      fileTree.visibleNodes[1],
      fileTree.visibleNodes[2],
      fileTree.visibleNodes[3],
      fileTree.visibleNodes[4],
    ]);
  });

  it("should deselect a range of nodes", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useSelections(fileTree));

    act(() => {
      // @ts-expect-error
      result.current.getProps(fileTree.visibleNodes[0]).onClick({});
      result.current
        .getProps(fileTree.visibleNodes[4])
        // @ts-expect-error
        .onClick({ shiftKey: true });
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([
      fileTree.visibleNodes[0],
      fileTree.visibleNodes[1],
      fileTree.visibleNodes[2],
      fileTree.visibleNodes[3],
      fileTree.visibleNodes[4],
    ]);

    act(() => {
      result.current
        .getProps(fileTree.visibleNodes[2])
        // @ts-expect-error
        .onClick({ shiftKey: true });
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([
      fileTree.visibleNodes[0],
      fileTree.visibleNodes[1],
      fileTree.visibleNodes[2],
    ]);
  });

  it("should deselect a range of nodes after some have been deselected with the meta key", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useSelections(fileTree));

    act(() => {
      // @ts-expect-error
      result.current.getProps(fileTree.visibleNodes[0]).onClick({});
      result.current
        .getProps(fileTree.visibleNodes[4])
        // @ts-expect-error
        .onClick({ shiftKey: true });
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([
      fileTree.visibleNodes[0],
      fileTree.visibleNodes[1],
      fileTree.visibleNodes[2],
      fileTree.visibleNodes[3],
      fileTree.visibleNodes[4],
    ]);

    act(() => {
      result.current
        .getProps(fileTree.visibleNodes[3])
        // @ts-expect-error
        .onClick({ metaKey: true });

      result.current
        .getProps(fileTree.visibleNodes[2])
        // @ts-expect-error
        .onClick({ shiftKey: true });
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([
      fileTree.visibleNodes[0],
      fileTree.visibleNodes[1],
      fileTree.visibleNodes[2],
      fileTree.visibleNodes[3],
    ]);
  });

  it("should not select/deselect a range if the tail is the node clicked with the shift key", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useSelections(fileTree));

    act(() => {
      // @ts-expect-error
      result.current.getProps(fileTree.visibleNodes[0]).onClick({});
      result.current
        .getProps(fileTree.visibleNodes[2])
        // @ts-expect-error
        .onClick({ shiftKey: true });
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([
      fileTree.visibleNodes[0],
      fileTree.visibleNodes[1],
      fileTree.visibleNodes[2],
    ]);

    act(() => {
      result.current
        .getProps(fileTree.visibleNodes[2])
        // @ts-expect-error
        .onClick({ metaKey: true });

      result.current
        .getProps(fileTree.visibleNodes[2])
        // @ts-expect-error
        .onClick({ shiftKey: true });
    });

    expect([...result.current.didChange.getSnapshot()]).toEqual([
      fileTree.visibleNodes[0],
      fileTree.visibleNodes[1],
      fileTree.visibleNodes[2],
    ]);
  });
});

function waitForTree(tree: FileTree<any>) {
  // @ts-expect-error: private access
  return Promise.all(tree.pendingLoadChildrenRequests.values());
}

function getNodesFromMockFs(parent: any, { createFile, createDir }: any) {
  return mockFs[parent.data.name].map((stat) => {
    if (stat.type === "file") {
      return createFile({ name: stat.name });
    }

    return createDir({ name: stat.name });
  });
}
