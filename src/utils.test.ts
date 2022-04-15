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
