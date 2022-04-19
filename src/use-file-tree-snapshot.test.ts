import { renderHook } from "@testing-library/react-hooks";
import { useFileTreeSnapshot } from ".";
import type { Dir } from "./file-tree";
import { createFileTree } from "./file-tree";
import { getNodesFromMockFs, waitForTree } from "./test/utils";

describe("useFileTreeSnapshot()", () => {
  let fileTree = createFileTree(getNodesFromMockFs);

  afterEach(() => {
    fileTree = createFileTree(getNodesFromMockFs);
  });

  it("should take snapshot of expanded directories", async () => {
    await waitForTree(fileTree);
    const handleSnapshot = jest.fn();
    renderHook(() => useFileTreeSnapshot(fileTree, handleSnapshot));

    expect(handleSnapshot).not.toHaveBeenCalled();
    const dir = fileTree.getById(fileTree.visibleNodes[0]) as Dir;
    await fileTree.expand(dir);
    expect(handleSnapshot).lastCalledWith({
      expandedPaths: [dir.path],
      buriedPaths: [],
      version: 1,
    });
  });

  it("should take snapshot of buried directories", async () => {
    await waitForTree(fileTree);
    const handleSnapshot = jest.fn();
    renderHook(() => useFileTreeSnapshot(fileTree, handleSnapshot));

    expect(handleSnapshot).not.toHaveBeenCalled();

    const dir = fileTree.getById(fileTree.visibleNodes[4]) as Dir;
    await fileTree.expand(dir, { recursive: true });
    expect(handleSnapshot).lastCalledWith({
      expandedPaths: ["/types/tree", "/types"],
      buriedPaths: [],
      version: 1,
    });

    fileTree.collapse(fileTree.getById(fileTree.visibleNodes[4]) as Dir);

    expect(handleSnapshot).lastCalledWith({
      expandedPaths: [],
      buriedPaths: ["/types/tree"],
      version: 1,
    });
  });
});
