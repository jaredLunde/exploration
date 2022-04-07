import { act, renderHook } from "@testing-library/react-hooks";
import { createFileTree } from "./file-tree";
import { getNodesFromMockFs, waitForTree } from "./test/utils";
import { useProps } from "./use-props";
import { useRovingFocus } from "./use-roving-focus";
import { useTraits } from "./use-traits";

describe("useProps()", () => {
  let fileTree = createFileTree(getNodesFromMockFs);

  afterEach(() => {
    fileTree = createFileTree(getNodesFromMockFs);
  });

  it("should merge props", async () => {
    await waitForTree(fileTree);
    const traits = renderHook(() => useTraits(fileTree, ["foo", "bar"]));
    const rovingFocus = renderHook(() => useRovingFocus(fileTree));
    const props = renderHook(() =>
      useProps(fileTree.root.nodes[0].id, [
        traits.result.current,
        rovingFocus.result.current,
      ])
    );

    act(() => {
      traits.result.current.add("foo", fileTree.root.nodes[0].id);
    });

    const prev = props.result.current;
    expect(props.result.current).toEqual({
      className: "foo",
      onFocus: expect.any(Function),
      onBlur: expect.any(Function),
      tabIndex: -1,
    });

    act(() => {
      traits.result.current.add("foo", fileTree.root.nodes[0].id);
    });

    expect(props.result.current).toBe(prev);
  });
});
