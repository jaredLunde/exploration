import { act, renderHook } from "@testing-library/react-hooks";
import { useThrottle } from "./use-deferred-value";

describe("useThrottle()", () => {
  it("should return the value immediately", () => {
    const { result } = renderHook(() => useThrottle(1, { timeoutMs: 200 }));

    expect(result.current).toBe(1);
  });

  it("should return the value after the timeout", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, { timeoutMs: 200 }),
      {
        initialProps: { value: 1 },
      }
    );

    expect(result.current).toBe(1);
    rerender({ value: 2 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe(1);
    rerender({ value: 3 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe(1);
    rerender({ value: 4 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe(4);
  });
});
