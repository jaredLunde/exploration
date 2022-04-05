import { act, renderHook } from "@testing-library/react-hooks";
import { createFileTree } from ".";
import { useDecorations } from "./use-decorations";

describe("useDecorations()", () => {
  const fileTree = createFileTree(() => []);

  it("should add a decoration", () => {
    const { result } = renderHook(() =>
      useDecorations<"foo">(fileTree, ["foo"])
    );

    act(() => {
      result.current.add("foo", 1);
    });

    expect(result.current.getProps(1)).toEqual({ className: "foo" });
  });

  it("should add a decoration to multiple IDs", () => {
    const { result } = renderHook(() =>
      useDecorations<"foo">(fileTree, ["foo"])
    );

    act(() => {
      result.current.add("foo", 1);
      result.current.add("foo", 2);
    });

    expect(result.current.getProps(1)).toEqual({ className: "foo" });
    expect(result.current.getProps(2)).toEqual({ className: "foo" });
  });

  it("should set a decoration", () => {
    const { result } = renderHook(() =>
      useDecorations<"foo">(fileTree, ["foo"])
    );

    act(() => {
      result.current.add("foo", 1);
    });

    act(() => {
      result.current.set("foo", [2]);
    });

    expect(result.current.getProps(1)).toEqual({ className: "" });
    expect(result.current.getProps(2)).toEqual({ className: "foo" });
  });

  it("should subscribe to getProps", () => {
    const { result } = renderHook(() =>
      useDecorations(fileTree, ["foo", "bar", "baz"])
    );

    const spy = jest.fn();

    result.current.didChange.subscribe((iterable) => {
      const next = iterable.next().value;
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
  });
});
