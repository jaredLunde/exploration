import { act, renderHook } from "@testing-library/react-hooks";
import { createFileTree } from "./file-tree";
import { getNodesFromMockFs, waitForTree } from "./test/utils";
import { useRovingFocus } from "./use-roving-focus";

describe("useRovingFocus()", () => {
  let fileTree = createFileTree(getNodesFromMockFs);

  afterEach(() => {
    fileTree = createFileTree(getNodesFromMockFs);
  });

  it("should focus", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useRovingFocus(fileTree));

    act(() => {
      // @ts-expect-error
      result.current.getProps(1).onFocus({});
    });

    expect(result.current.didChange.getSnapshot()).toBe(1);
    expect(result.current.getProps(1).tabIndex).toBe(0);
  });

  it("should blur", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useRovingFocus(fileTree));

    act(() => {
      // @ts-expect-error
      result.current.getProps(0).onFocus({});
    });
    act(() => {
      // @ts-expect-error
      result.current.getProps(0).onBlur({});
    });
    expect(result.current.didChange.getSnapshot()).toBe(-1);

    act(() => {
      // @ts-expect-error
      result.current.getProps(1).onFocus({});
    });
    act(() => {
      // @ts-expect-error
      result.current.getProps(0).onBlur({});
    });
    expect(result.current.didChange.getSnapshot()).toBe(1);

    act(() => {
      // @ts-expect-error
      result.current.getProps(1).onBlur({});
    });
    expect(result.current.didChange.getSnapshot()).toBe(-1);
    expect(result.current.getProps(1).tabIndex).toBe(-1);
  });
});
