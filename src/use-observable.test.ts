import { renderHook } from "@testing-library/react-hooks";
import { useObservable } from ".";
import { observable } from "./tree/observable";

describe("useObservable()", () => {
  it("should fire a callback when the subscription invokes it", async () => {
    const value = observable(0);
    const handleChange = jest.fn();
    renderHook(() => useObservable(value, handleChange));
    value.next(1);
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it("should not fire a callback when the subscription invokes it after the hook has unmounted", async () => {
    const value = observable(0);
    const handleChange = jest.fn();
    const { unmount } = renderHook(() => useObservable(value, handleChange));
    unmount();
    value.next(1);
    expect(handleChange).not.toHaveBeenCalledWith(1);
  });
});
