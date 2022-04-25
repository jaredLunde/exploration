import { fireEvent } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import { useResizeObserver } from "./use-resize-observer";

class ResizeObserverPolyfill {
  callbacks: any[] = [];

  constructor(callback: any) {
    this.callbacks = [callback];
  }

  onResize = (e: any) => {
    for (const callback of this.callbacks) {
      const entry = new ResizeObserverEntry();
      entry.target = e.target;
      entry.borderBoxSize = [new ResizeObserverSize()];
      entry.contentBoxSize = [new ResizeObserverSize()];
      callback([entry]);
    }
  };

  observe(element: HTMLElement) {
    element.addEventListener("resize", this.onResize);
  }

  unobserve(element: HTMLElement) {
    element.removeEventListener("resize", this.onResize);
  }

  disconnect() {
    this.callbacks = [];
  }
}

class ResizeObserverEntry {
  borderBoxSize: ReadonlyArray<ResizeObserverSize>;
  contentBoxSize: ReadonlyArray<ResizeObserverSize>;
  contentRect: DOMRectReadOnly;
  devicePixelContentBoxSize: ReadonlyArray<ResizeObserverSize>;
  target: Element;
}

class ResizeObserverSize {
  readonly blockSize: number;
  readonly inlineSize: number;
}

describe("useResizeObserver()", () => {
  it("should fire a callback when the subscription invokes it", async () => {
    const callbackA = jest.fn();
    const callbackB = jest.fn();
    const element = document.createElement("div");
    const ref = { current: element };

    const a = renderHook(() =>
      useResizeObserver(ref, callbackA, {
        ResizeObserver: ResizeObserverPolyfill,
      })
    );
    renderHook(() =>
      useResizeObserver(ref, callbackB, {
        ResizeObserver: ResizeObserverPolyfill,
      })
    );

    fireEvent.resize(element);
    expect(callbackA).toHaveBeenCalledTimes(1);
    expect(callbackB).toHaveBeenCalledTimes(1);

    a.unmount();

    fireEvent.resize(element);
    expect(callbackA).toHaveBeenCalledTimes(1);
    expect(callbackB).toHaveBeenCalledTimes(2);
  });

  it("should listen to multiple elements", async () => {
    const callbackA = jest.fn();
    const callbackB = jest.fn();
    const elementA = document.createElement("div");
    const elementB = document.createElement("div");
    const refA = { current: elementA };
    const refB = { current: elementB };

    renderHook(() =>
      useResizeObserver(refA, callbackA, {
        ResizeObserver: ResizeObserverPolyfill,
      })
    );
    renderHook(() =>
      useResizeObserver(refB, callbackB, {
        ResizeObserver: ResizeObserverPolyfill,
      })
    );

    fireEvent.resize(elementA);
    expect(callbackA).toHaveBeenCalledTimes(1);
    expect(callbackB).toHaveBeenCalledTimes(0);

    fireEvent.resize(elementB);
    expect(callbackA).toHaveBeenCalledTimes(1);
    expect(callbackB).toHaveBeenCalledTimes(1);
  });
});
