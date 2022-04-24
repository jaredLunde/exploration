import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import {
  useHotkeys,
  useObserver,
  useRovingFocus,
  useSelections,
  useTraits,
} from ".";
import { createFileTree } from "./file-tree";
import type { Dir } from "./file-tree";
import { getNodesFromMockFs, waitForTree } from "./test/utils";

describe("useHotkeys()", () => {
  let fileTree = createFileTree(getNodesFromMockFs);

  afterEach(() => {
    fileTree = createFileTree(getNodesFromMockFs);
  });

  beforeAll(() => {
    // this is here to silence a warning temporarily
    // we'll fix it in the next exercise
    jest.spyOn(console, "error").mockImplementation((...args) => {});
  });

  afterAll(() => {
    // @ts-expect-error
    console.error.mockRestore();
  });

  const createComponent = () => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    element.tabIndex = 0;
    element.style.paddingTop = "0";
    element.style.paddingBottom = "0";
    Object.defineProperties(element, {
      clientHeight: {
        get: () => 24,
      },
    });
    const windowRef = { current: element };

    return [
      element,
      () => {
        const [, forceUpdate] = React.useState({});
        const rovingFocus = useRovingFocus(fileTree);
        const selections = useSelections(fileTree);
        const traits = useTraits(fileTree, ["selected"]);

        useHotkeys(fileTree, {
          windowRef,
          rovingFocus,
          selections,
        });

        useObserver(rovingFocus.didChange, () => {
          forceUpdate({});
        });

        useObserver(selections.didChange, (nodeIds) => {
          traits.set("selected", [...nodeIds]);
          forceUpdate({});
        });

        return (
          <React.Fragment>
            {fileTree.visibleNodes.map((nodeId, index) => (
              <div
                key={nodeId}
                id={`exploration-${index}`}
                data-exploration-index={index}
                {...rovingFocus.getProps(nodeId)}
                {...selections.getProps(nodeId)}
                {...traits.getProps(nodeId)}
                tabIndex={0}
              />
            ))}

            <input type="text" aria-label="input" />
            <textarea aria-label="textarea" />
          </React.Fragment>
        );
      },
    ] as const;
  };

  it('should traverse the file tree with the "up" and "down" keys', async () => {
    await waitForTree(fileTree);

    const [element, Component] = createComponent();
    render(<Component />, { container: element });

    fireEvent.keyDown(element, { key: "ArrowDown" });
    expect(document.activeElement as any).toBe(
      document.getElementById("exploration-0")
    );

    fireEvent.keyDown(element, { key: "ArrowDown" });

    expect(document.activeElement as any).toBe(
      document.getElementById("exploration-1")
    );

    fireEvent.keyDown(element, { key: "ArrowUp" });
    expect(document.activeElement as any).toBe(
      document.getElementById("exploration-0")
    );
  });

  it('should open directory when "right" key is pressed and close directory when "left" key is pressed', async () => {
    await waitForTree(fileTree);

    const dir = fileTree.getById(fileTree.visibleNodes[0]) as Dir;
    const [element, Component] = createComponent();
    render(<Component />, { container: element });

    fireEvent.keyDown(element, { key: "ArrowDown" });
    fireEvent.keyDown(element, { key: "ArrowRight" });

    expect(document.activeElement as any).toBe(
      document.getElementById("exploration-0")
    );

    expect(dir.expanded).toBe(true);
    expect(document.activeElement as any).toBe(
      document.getElementById("exploration-0")
    );

    await waitFor(() => {
      fireEvent.keyDown(element, { key: "ArrowRight" });
      expect(document.activeElement as any).toBe(
        document.getElementById("exploration-1")
      );
    });

    await waitFor(() => {
      fireEvent.keyDown(element, { key: "ArrowLeft" });
      expect(dir.expanded).toBe(false);
      expect(document.activeElement as any).toBe(
        document.getElementById("exploration-0")
      );
    });
  });

  it('should expand a directory when the "space" key is pressed on a directory', async () => {
    await waitForTree(fileTree);

    const dir = fileTree.getById(fileTree.visibleNodes[0]) as Dir;
    const [element, Component] = createComponent();
    render(<Component />, { container: element });

    fireEvent.keyDown(element, { key: "ArrowDown" });
    fireEvent.keyDown(element, { key: " " });

    expect(dir.expanded).toBe(true);
    expect(document.activeElement as any).toBe(
      document.getElementById("exploration-0")
    );

    fireEvent.keyDown(element, { key: " " });
    expect(dir.expanded).toBe(false);
  });

  it('should select when the "space" key is pressed on a file', async () => {
    await waitForTree(fileTree);
    const [element, Component] = createComponent();
    render(<Component />, { container: element });

    fireEvent.keyDown(element, { key: "End" });
    fireEvent.keyDown(element, { key: " " });

    await waitFor(() => {
      expect(document.activeElement as any).toHaveClass("selected");
    });
  });

  it('should focus the first node when the "Home" key is pressed', async () => {
    await waitForTree(fileTree);
    const [element, Component] = createComponent();
    render(<Component />, { container: element });

    fireEvent.keyDown(element, { key: "Home" });

    expect(document.activeElement as any).toBe(
      document.getElementById("exploration-0")
    );
  });

  it('should clear selections and focus the container when the "Escape" key is pressed', async () => {
    await waitForTree(fileTree);
    const [element, Component] = createComponent();
    render(<Component />, { container: element });

    fireEvent.keyDown(element, { key: "End" });
    fireEvent.keyDown(element, { key: " " });

    const focusedElement = document.activeElement;
    expect(focusedElement as any).toHaveClass("selected");

    fireEvent.keyDown(element, { key: "Escape" });
    expect(focusedElement as any).not.toHaveClass("selected");

    await waitFor(() => {
      expect(document.activeElement as any).toBe(element);
    });
  });

  it("should be a noop if the focused element is an input", () => {
    const [element, Component] = createComponent();
    render(<Component />, { container: element });
    const input = screen.getByRole("textbox", { name: "input" });
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "ArrowRight" });
    fireEvent.keyDown(input, { key: "ArrowLeft" });
    fireEvent.keyDown(input, { key: "Home" });
    fireEvent.keyDown(input, { key: "End" });
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.keyDown(input, { key: " " });
    expect(document.activeElement as any).toBe(input);
  });

  it("should be a noop if the focused element is an textarea", () => {
    const [element, Component] = createComponent();
    render(<Component />, { container: element });
    const textarea = screen.getByRole("textbox", { name: "textarea" });
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "ArrowDown" });
    fireEvent.keyDown(textarea, { key: "ArrowUp" });
    fireEvent.keyDown(textarea, { key: "ArrowRight" });
    fireEvent.keyDown(textarea, { key: "ArrowLeft" });
    fireEvent.keyDown(textarea, { key: "Home" });
    fireEvent.keyDown(textarea, { key: "End" });
    fireEvent.keyDown(textarea, { key: "Escape" });
    fireEvent.keyDown(textarea, { key: " " });
    expect(document.activeElement as any).toBe(textarea);
  });
});
