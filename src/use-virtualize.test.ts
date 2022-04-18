import { act, renderHook } from "@testing-library/react-hooks";
import { useVirtualize } from ".";
import { createFileTree } from "./file-tree";
import { getNodesFromMockFs, waitForTree } from "./test/utils";

const scrollEvent = document.createEvent("Event");
scrollEvent.initEvent("scroll", true, true);

// @ts-expect-error
window.scrollTo = (options?: ScrollToOptions): void => {
  Object.defineProperty(window, "scrollY", {
    value: options.top,
    configurable: true,
  });
  window.dispatchEvent(scrollEvent);
};

beforeEach(() => {
  window.scrollTo({ top: 0 });
});

describe("useVirtualize()", () => {
  let fileTree = createFileTree(getNodesFromMockFs);

  afterEach(() => {
    fileTree = createFileTree(getNodesFromMockFs);
  });

  it("should return scrollTop", async () => {
    await waitForTree(fileTree);

    const { result } = renderHook(() =>
      useVirtualize(fileTree, { windowRef: window, nodeHeight: 24 })
    );

    act(() => {
      window.scrollTo({ top: 90 });
    });

    expect(result.current.scrollTop).toBe(90);
  });

  it("should update isScrolling", async () => {
    await waitForTree(fileTree);

    const { result } = renderHook(() =>
      useVirtualize(fileTree, { windowRef: window, nodeHeight: 24 })
    );

    act(() => {
      window.scrollTo({ top: 90 });
    });

    expect(result.current.isScrolling).toBe(true);
    expect(result.current.props).toEqual(
      expect.objectContaining({
        style: expect.objectContaining({
          pointerEvents: "none",
        }),
      })
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current.isScrolling).toBe(false);
    expect(result.current.props).toEqual(
      expect.objectContaining({
        style: expect.objectContaining({
          pointerEvents: undefined,
        }),
      })
    );
  });

  it("should scroll to a node", () => {
    window.innerHeight = 48;

    const { result } = renderHook(() =>
      useVirtualize(fileTree, { windowRef: window, nodeHeight: 24 })
    );

    act(() => {
      result.current.scrollToNode(fileTree.visibleNodes[5]);
    });

    expect(result.current.scrollTop).toBe(24 * 5);

    act(() => {
      result.current.scrollToNode(fileTree.visibleNodes[5]);
    });

    expect(result.current.scrollTop).toBe(24 * 5);
  });

  it("should scroll to a given position", () => {
    window.innerHeight = 48;

    const { result } = renderHook(() =>
      useVirtualize(fileTree, { windowRef: window, nodeHeight: 24 })
    );

    act(() => {
      result.current.scrollTo(48);
    });

    expect(result.current.scrollTop).toBe(48);
  });

  it("should scroll to a node and center it", () => {
    window.innerHeight = 24 * 3;

    const { result } = renderHook(() =>
      useVirtualize(fileTree, { windowRef: window, nodeHeight: 24 })
    );

    act(() => {
      result.current.scrollToNode(fileTree.visibleNodes[5], {
        align: "center",
      });
    });

    expect(result.current.scrollTop).toBe(72);
  });

  it("should scroll to a node at the end", () => {
    window.innerHeight = 24 * 3;

    const { result } = renderHook(() =>
      useVirtualize(fileTree, { windowRef: window, nodeHeight: 24 })
    );

    act(() => {
      result.current.scrollToNode(fileTree.visibleNodes[5], {
        align: "end",
      });
    });

    expect(result.current.scrollTop).toBe(24);
  });

  it("should scroll to a node at w/ auto positioning", () => {
    window.innerHeight = 24 * 3;

    const { result } = renderHook(() =>
      useVirtualize(fileTree, { windowRef: window, nodeHeight: 24 })
    );

    act(() => {
      result.current.scrollToNode(fileTree.visibleNodes[5], {
        align: "auto",
      });
    });

    expect(result.current.scrollTop).toBe(24);
  });

  it("should scroll to a node at w/ smart positioning", () => {
    window.innerHeight = 24 * 3;

    const { result } = renderHook(() =>
      useVirtualize(fileTree, { windowRef: window, nodeHeight: 24 })
    );

    act(() => {
      result.current.scrollToNode(fileTree.visibleNodes[5], {
        align: "smart",
      });
    });

    expect(result.current.scrollTop).toBe(24);
  });

  it("should scroll to a node at w/ smart positioning centered", () => {
    window.innerHeight = 16;

    const { result } = renderHook(() =>
      useVirtualize(fileTree, { windowRef: window, nodeHeight: 24 })
    );

    act(() => {
      result.current.scrollToNode(fileTree.visibleNodes[5], {
        align: "smart",
      });
    });

    expect(result.current.scrollTop).toBe(100);
  });

  it("should render the correct number of nodes", () => {
    window.innerHeight = 24 * 3;
    window.scrollTo({ top: 0 });

    const { result } = renderHook(() =>
      useVirtualize(fileTree, {
        windowRef: window,
        nodeHeight: 24,
        overscanBy: 1,
      })
    );
    const Component = jest.fn();
    act(() => result.current.map(Component));
    expect(Component).toHaveBeenCalledTimes(3);
  });

  it("should render the correct number of nodes w/ gap", () => {
    window.innerHeight = 24 * 3;
    window.scrollTo({ top: 0 });

    const { result } = renderHook(() =>
      useVirtualize(fileTree, {
        windowRef: window,
        nodeHeight: 24,
        nodeGap: 24,
        overscanBy: 1,
      })
    );
    const Component = jest.fn();
    act(() => result.current.map(Component));
    expect(Component).toHaveBeenCalledTimes(2);
  });

  it("should render the correct number of nodes w/ overscan", () => {
    window.innerHeight = 24 * 3;
    window.scrollTo({ top: 0 });

    const { result } = renderHook(() =>
      useVirtualize(fileTree, {
        windowRef: window,
        nodeHeight: 24,
        nodeGap: 24,
        overscanBy: 2,
      })
    );
    const Component = jest.fn();
    act(() => result.current.map(Component));
    expect(Component).toHaveBeenCalledTimes(3);
  });

  it("should render nodes with props", () => {
    window.innerHeight = 48;
    window.scrollTo({ top: 0 });

    const { result } = renderHook(() =>
      useVirtualize(fileTree, {
        windowRef: window,
        nodeHeight: 24,
        nodeGap: 24,
        overscanBy: 1,
      })
    );
    const Component = jest.fn();
    act(() => result.current.map(Component));

    expect(Component).toHaveBeenCalledWith(
      expect.objectContaining({
        style: expect.objectContaining({
          top: 0,
          height: 24,
        }),
      })
    );

    act(() => {
      window.scrollTo({ top: 48 });
    });
    act(() => result.current.map(Component));

    expect(Component).toHaveBeenCalledWith(
      expect.objectContaining({
        style: expect.objectContaining({
          top: 48,
          height: 24,
        }),
      })
    );
  });

  it("should return container props", () => {
    window.innerHeight = 24 * 3;
    window.scrollTo({ top: 0 });

    const { result } = renderHook(() =>
      useVirtualize(fileTree, {
        windowRef: window,
        nodeHeight: 24,
        nodeGap: 24,
        overscanBy: 2,
      })
    );

    expect(result.current.props).toEqual(
      expect.objectContaining({
        style: expect.objectContaining({
          height: 48 * fileTree.visibleNodes.length - 24,
        }),
      })
    );
  });

  it("should calculate the height of arbitrary DOM elementss", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    element.style.paddingTop = "0";
    element.style.paddingBottom = "0";
    Object.defineProperties(element, {
      clientHeight: {
        get: () => 24,
      },
    });
    const ref = { current: element };

    const { result } = renderHook(() =>
      useVirtualize(fileTree, {
        windowRef: ref,
        nodeHeight: 24,
        nodeGap: 24,
        overscanBy: 1,
      })
    );

    const Component = jest.fn();
    act(() => result.current.map(Component));
    expect(Component).toHaveBeenCalledTimes(1);
    document.body.removeChild(element);
  });
});
