import { mergeProps } from ".";
import { retryWithBackoff, shallowEqual, throttle } from "./utils";

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
    expect(handleA).lastCalledWith("foo");
    expect(handleB).lastCalledWith("foo");
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

describe("throttle()", () => {
  it("should invoke the callback once per timeout", () => {
    const fn = jest.fn((value: number) => {});
    const throttled = throttle(fn, 30);

    throttled(1);
    expect(fn).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(1000 / 60);

    throttled(2);
    expect(fn).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(1000 / 60);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).lastCalledWith(2);
  });

  it("should fire a leading call", () => {
    const fn = jest.fn((value: number) => {});
    const throttled = throttle(fn, 30, true);

    throttled(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).lastCalledWith(1);

    throttled(2);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).lastCalledWith(1);
    jest.advanceTimersByTime(1000 / 60);

    throttled(3);
    jest.advanceTimersByTime(1000 / 60);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).lastCalledWith(3);
  });
});

describe("retryWithBackoff()", () => {
  it("should retry with backoff", async () => {
    const fn = jest.fn(async () => {
      throw new Error("error");
    });

    const promise = retryWithBackoff(fn, {
      initialDelay: 1,
      delayMultiple: 2,
      maxRetries: 3,
    });

    expect(fn).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(2);

    await Promise.resolve();
    jest.advanceTimersByTime(2);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(3);

    await Promise.resolve();
    jest.advanceTimersByTime(4);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(4);

    const catchFn = jest.fn();
    await promise.catch(catchFn);
    expect(catchFn).lastCalledWith(new Error("error"));
  });

  it("should return value", async () => {
    const fn = jest.fn(async () => {
      return "foo";
    });
    const promise = retryWithBackoff(fn);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(await promise).toBe("foo");
  });

  it("prevent retrying if shouldRetry returns false", async () => {
    const fn = jest.fn(async () => {
      throw new Error("error");
    });

    const promise = retryWithBackoff(fn, {
      initialDelay: 1,
      delayMultiple: 2,
      maxRetries: 3,
      shouldRetry: () => false,
    });

    expect(fn).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);

    const catchFn = jest.fn();
    await promise.catch(catchFn);
    expect(catchFn).lastCalledWith(new Error("error"));
  });
});
