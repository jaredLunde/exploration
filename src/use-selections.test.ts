import { act, renderHook } from "@testing-library/react-hooks";
import { useSelections } from ".";
import { createFileTree } from "./file-tree";
import { getNodesFromMockFs, waitForTree } from "./test/utils";

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

    expect([...result.current.didChange.getState()]).toEqual([
      fileTree.visibleNodes[0],
    ]);
  });

  it("should select a single node with the handle", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useSelections(fileTree));

    act(() => {
      result.current.select(fileTree.visibleNodes[0]);
    });

    expect([...result.current.didChange.getState()]).toEqual([
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

    expect([...result.current.didChange.getState()]).toEqual([]);
  });

  it("should clear selections", async () => {
    await waitForTree(fileTree);
    const { result } = renderHook(() => useSelections(fileTree));

    act(() => {
      result.current.select(fileTree.visibleNodes[0]);
      result.current.clear();
    });

    expect([...result.current.didChange.getState()]).toEqual([]);
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

    expect([...result.current.didChange.getState()]).toEqual([
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

    expect([...result.current.didChange.getState()]).toEqual([
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

    expect([...result.current.didChange.getState()]).toEqual([
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

    expect([...result.current.didChange.getState()]).toEqual([
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

    expect([...result.current.didChange.getState()]).toEqual([
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

    expect([...result.current.didChange.getState()]).toEqual([
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

    expect([...result.current.didChange.getState()]).toEqual([
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

    expect([...result.current.didChange.getState()]).toEqual([
      fileTree.visibleNodes[0],
      fileTree.visibleNodes[1],
      fileTree.visibleNodes[2],
      fileTree.visibleNodes[4],
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

    expect([...result.current.didChange.getState()]).toEqual([
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

    expect([...result.current.didChange.getState()]).toEqual([
      fileTree.visibleNodes[0],
      fileTree.visibleNodes[1],
      fileTree.visibleNodes[2],
    ]);
  });
});
