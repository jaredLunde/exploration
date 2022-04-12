import { renderHook } from "@testing-library/react-hooks";
import { createFileTree } from "./file-tree";
import { getNodesFromMockFs, waitForTree } from "./test/utils";
import { useFilter } from "./use-filter";

describe("useFilter()", () => {
  let fileTree = createFileTree(getNodesFromMockFs);

  afterEach(() => {
    fileTree = createFileTree(getNodesFromMockFs);
  });

  it("should filter based on a callback", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() =>
      useFilter(fileTree, (node) => !!node.basename.match(/ith/))
    );

    expect(result.current).toEqual([
      fileTree.root.nodes.find((node) => node.basename.match(/github/)).id,
    ]);
  });

  it("should not filter if the filter is null", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useFilter(fileTree, null));

    expect(result.current).toEqual(fileTree.visibleNodes);
  });
});
