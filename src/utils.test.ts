import { mergeProps } from ".";
import { shallowEqual } from "./utils";

describe("shallowEqual()", () => {
  it("should return true for equal objects", () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  it("should return false for unequal objects", () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  });

  it("should return true for equal nulls", () => {
    expect(shallowEqual(null, null)).toBe(true);
  });

  it("should return false for unequal nulls", () => {
    expect(shallowEqual(null, undefined)).toBe(false);
  });

  it("should return true for equal undefineds", () => {
    expect(shallowEqual(undefined, undefined)).toBe(true);
  });

  it("should return false for unequal undefineds", () => {
    expect(shallowEqual(undefined, null)).toBe(false);
  });

  it("should return false for null/object", () => {
    expect(shallowEqual({}, null)).toBe(false);
  });

  it("should return false for object/null", () => {
    expect(shallowEqual(null, {})).toBe(false);
  });
});

describe("mergeProps()", () => {
  it("should chain callbacks", () => {
    const handleA = jest.fn();
    const handleB = jest.fn();
    const merged = mergeProps([{ onChange: handleA }, { onChange: handleB }]);

    merged.onChange("foo");
    expect(handleA).toHaveBeenCalledWith("foo");
    expect(handleB).toHaveBeenCalledWith("foo");
  });

  it("should merge class names", () => {
    const merged = mergeProps([{ className: "foo" }, { className: "bar" }]);

    expect(merged.className).toBe("foo bar");
  });

  it("should merge unsafe class names", () => {
    const merged = mergeProps([
      // eslint-disable-next-line camelcase
      { UNSAFE_className: "foo" },
      // eslint-disable-next-line camelcase
      { UNSAFE_className: "bar" },
    ]);

    expect(merged.UNSAFE_className).toBe("foo bar");
  });

  it("should merge styles", () => {
    const merged = mergeProps([
      { style: { color: "red" } },
      { style: { backgroundColor: "blue" } },
    ]);

    expect(merged.style).toEqual({ color: "red", backgroundColor: "blue" });
  });

  it("should merge styles 2", () => {
    const merged = mergeProps([{}, { style: { backgroundColor: "blue" } }]);

    expect(merged.style).toEqual({ backgroundColor: "blue" });
  });
});
