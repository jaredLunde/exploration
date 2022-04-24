import { renderHook } from "@testing-library/react-hooks";
import { useObserver } from ".";
import { subject } from "./tree/subject";

describe("useObserver()", () => {
  it("should fire a callback when the subscription invokes it", async () => {
    const value = subject(0);
    const handleChange = jest.fn();
    renderHook(() => useObserver(value, handleChange));
    value.setState(1);
    expect(handleChange).lastCalledWith(1);
  });

  it("should not fire a callback when the subscription invokes it after the hook has unmounted", async () => {
    const value = subject(0);
    const handleChange = jest.fn();
    const { unmount } = renderHook(() => useObserver(value, handleChange));
    unmount();
    value.setState(1);
    expect(handleChange).not.toHaveBeenCalledWith(1);
  });
});
