import { act, renderHook } from "@testing-library/react-hooks";
import { useTraits } from ".";
import { createFileTree } from "./file-tree";

describe("useTraits()", () => {
  let fileTree = createFileTree(() => []);

  afterEach(() => {
    fileTree = createFileTree(() => []);
  });

  it("should add a decoration", () => {
    const { result } = renderHook(() => useTraits(fileTree, ["foo"]));

    act(() => {
      result.current.add("foo", 1);
    });

    expect(result.current.getProps(1)).toEqual({ className: "foo" });
  });

  it("should add a decoration to multiple IDs", () => {
    const { result } = renderHook(() => useTraits(fileTree, ["foo"]));

    act(() => {
      result.current.add("foo", 1);
      result.current.add("foo", 2);
    });

    expect(result.current.getProps(1)).toEqual({ className: "foo" });
    expect(result.current.getProps(2)).toEqual({ className: "foo" });
  });

  it("should set a decoration", () => {
    const { result } = renderHook(() => useTraits(fileTree, ["foo"]));

    act(() => {
      result.current.add("foo", 1);
    });

    act(() => {
      result.current.set("foo", [2]);
    });

    expect(result.current.getProps(1)).toEqual({ className: "" });
    expect(result.current.getProps(2)).toEqual({ className: "foo" });
  });

  it("should delete a decoration", () => {
    const { result } = renderHook(() => useTraits(fileTree, ["foo", "bar"]));

    act(() => {
      result.current.add("foo", 1);
      result.current.add("bar", 1);
    });

    expect(result.current.getProps(1)).toEqual({ className: "foo bar" });

    act(() => {
      result.current.delete("bar", 1);
    });

    expect(result.current.getProps(1)).toEqual({ className: "foo" });
  });

  it("should clear all decorations from a node", () => {
    const { result } = renderHook(() => useTraits(fileTree, ["foo", "bar"]));

    act(() => {
      result.current.add("foo", 1);
      result.current.add("bar", 1);
    });

    expect(result.current.getProps(1)).toEqual({ className: "foo bar" });

    act(() => {
      result.current.clearNode(1);
    });

    expect(result.current.getProps(1)).toEqual({ className: "" });
  });

  it("should clear nodes from a decoration", () => {
    const { result } = renderHook(() => useTraits(fileTree, ["foo", "bar"]));

    act(() => {
      result.current.add("foo", 1);
      result.current.add("foo", 2);
    });

    expect(result.current.getProps(1)).toEqual({ className: "foo" });
    expect(result.current.getProps(2)).toEqual({ className: "foo" });

    act(() => {
      result.current.clear("foo");
    });

    expect(result.current.getProps(1)).toEqual({ className: "" });
    expect(result.current.getProps(2)).toEqual({ className: "" });
  });

  it("should clear all decorations", () => {
    const { result } = renderHook(() => useTraits(fileTree, ["foo", "bar"]));

    act(() => {
      result.current.add("foo", 1);
      result.current.add("bar", 1);
      result.current.add("foo", 2);
      result.current.add("bar", 2);
    });

    expect(result.current.getProps(1)).toEqual({ className: "foo bar" });
    expect(result.current.getProps(2)).toEqual({ className: "foo bar" });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.getProps(1)).toEqual({ className: "" });
    expect(result.current.getProps(2)).toEqual({ className: "" });
  });

  it("should subscribe to getProps", () => {
    const { result } = renderHook(() =>
      useTraits(fileTree, ["foo", "bar", "baz"])
    );

    const spy = jest.fn();

    result.current.didChange.subscribe((iterable) => {
      const next = iterable.entries().next().value;
      if (!next) return;
      const [k, v] = next;
      spy([k, [...v]]);
    });

    act(() => {
      result.current.set("foo", [2]);
    });

    expect(result.current.getProps(2)).toEqual({ className: "foo" });

    act(() => {
      result.current.set("bar", [2]);
    });

    let first = result.current.getProps(2);
    expect(first).toEqual({ className: "foo bar" });
    expect(first).toBe(result.current.getProps(2));

    act(() => {
      result.current.set("baz", [2]);
      result.current.set("baz", [2, 3]);
    });

    first = result.current.getProps(2);
    expect(first).toEqual({ className: "foo bar baz" });
    expect(first).toBe(result.current.getProps(2));
    expect(result.current.getProps(3)).toEqual({ className: "baz" });

    act(() => {
      result.current.delete("baz", 2);
    });

    first = result.current.getProps(2);
    expect(first).toEqual({ className: "foo bar" });
    expect(first).toBe(result.current.getProps(2));
    expect(result.current.getProps(3)).toEqual({ className: "baz" });

    act(() => {
      result.current.clear("foo");
    });

    first = result.current.getProps(2);
    expect(first).toEqual({ className: "bar" });
    expect(first).toBe(result.current.getProps(2));

    act(() => {
      result.current.clearNode(2);
    });

    first = result.current.getProps(2);
    expect(first).toEqual({ className: "" });
    expect(first).toBe(result.current.getProps(2));
    expect(result.current.getProps(3)).toEqual({ className: "baz" });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.getProps(3)).toEqual({ className: "" });
  });
});
