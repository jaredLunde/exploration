import { act, fireEvent, render, waitFor } from "@testing-library/react";
import * as React from "react";
import type { DndEvent } from ".";
import { useDnd, useObservable } from ".";
import type { Dir } from "./file-tree";
import { createFileTree } from "./file-tree";
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

  const createComponent = (
    props: {
      onChange?: (event: DndEvent<any>) => void;
      options?: {
        dragOverExpandTimeout?: number;
      };
    } = {}
  ) => {
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

    return [
      element,
      () => {
        const [, forceUpdate] = React.useState({});
        const dnd = useDnd(fileTree, props.options);

        useObservable(dnd.didChange, (value) => {
          forceUpdate({});
          props.onChange?.(value);
        });

        return (
          <React.Fragment>
            {fileTree.visibleNodes.map((nodeId, index) => (
              <div
                key={nodeId}
                id={`exp-${index}`}
                tabIndex={0}
                {...dnd.getProps(nodeId)}
              />
            ))}
          </React.Fragment>
        );
      },
    ] as const;
  };

  it('should fire a drag "start" event', async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragStart(document.getElementById("exp-0"));

    expect(handleChange).toHaveBeenCalledWith({
      type: "start",
      node: fileTree.getById(fileTree.visibleNodes[0]),
    });
  });

  it('should fire a drag "end" event', async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragEnd(document.getElementById("exp-0"));

    expect(handleChange).toHaveBeenCalledWith({
      type: "end",
      node: fileTree.getById(fileTree.visibleNodes[0]),
    });
  });

  it('should fire a drag "enter" event on a directory', async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragStart(document.getElementById("exp-0"));
    fireEvent.dragEnter(document.getElementById("exp-1"));

    expect(handleChange).toHaveBeenCalledWith({
      type: "enter",
      node: fileTree.getById(fileTree.visibleNodes[0]),
      dir: fileTree.getById(fileTree.visibleNodes[1]),
    });
  });

  it('should not fire a drag "enter" event on a directory if there is no node', async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragEnter(document.getElementById("exp-1"));

    expect(handleChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: "enter",
        dir: fileTree.getById(fileTree.visibleNodes[1]),
      })
    );
  });

  it('should not fire a drag "enter" event on a file', async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragStart(document.getElementById("exp-0"));
    fireEvent.dragEnter(
      document.getElementById(`exp-${fileTree.visibleNodes.length - 1}`)
    );

    expect(handleChange).not.toHaveBeenCalledWith({
      type: "enter",
      node: fileTree.getById(fileTree.visibleNodes[0]),
      dir: fileTree.getById(
        fileTree.visibleNodes[fileTree.visibleNodes.length - 1]
      ),
    });
  });

  it('should fire a drag "leave" event on a directory', async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragStart(document.getElementById("exp-0"));
    fireEvent.dragEnter(document.getElementById("exp-1"));
    fireEvent.dragEnter(document.getElementById("exp-2"));
    fireEvent.dragLeave(document.getElementById("exp-1"));

    expect(handleChange).toHaveBeenCalledWith({
      type: "leave",
      node: fileTree.getById(fileTree.visibleNodes[0]),
      dir: fileTree.getById(fileTree.visibleNodes[1]),
    });
  });

  it('should fire a drag "leave" event on a directory if it was the last entered', async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragStart(document.getElementById("exp-0"));
    fireEvent.dragEnter(document.getElementById("exp-1"));
    fireEvent.dragLeave(document.getElementById("exp-1"));

    expect(handleChange).not.toHaveBeenCalledWith({
      type: "leave",
      node: fileTree.getById(fileTree.visibleNodes[0]),
      dir: fileTree.getById(fileTree.visibleNodes[1]),
    });
  });

  it('should not fire a drag "leave" event on a file', async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragStart(document.getElementById("exp-0"));
    fireEvent.dragEnter(document.getElementById("exp-1"));
    fireEvent.dragLeave(
      document.getElementById(`exp-${fileTree.visibleNodes.length - 1}`)
    );

    expect(handleChange).not.toHaveBeenCalledWith({
      type: "leave",
      node: fileTree.getById(fileTree.visibleNodes[0]),
      dir: fileTree.getById(
        fileTree.visibleNodes[fileTree.visibleNodes.length - 1]
      ),
    });
  });

  it("should expand a directory after the default dragover timeout", async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragStart(document.getElementById("exp-0"));
    fireEvent.dragEnter(document.getElementById("exp-1"));
    const dir = fileTree.getById(fileTree.visibleNodes[1]) as Dir;
    expect(dir.expanded).toBe(false);

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(dir.expanded).toBe(true);
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith({
        type: "expanded",
        dir,
        node: fileTree.getById(fileTree.visibleNodes[0]),
      });
    });
  });

  it("should expand a directory after the user-defined dragover timeout", async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({
      onChange: handleChange,
      options: { dragOverExpandTimeout: 200 },
    });
    render(<Component />, { container: element });

    fireEvent.dragStart(document.getElementById("exp-0"));
    fireEvent.dragEnter(document.getElementById("exp-1"));
    const dir = fileTree.getById(fileTree.visibleNodes[1]) as Dir;
    expect(dir.expanded).toBe(false);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(dir.expanded).toBe(true);
  });

  it("should not expand a directory after the default dragover timeout if another directory has been entered in the meantime", async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragStart(document.getElementById("exp-0"));
    fireEvent.dragEnter(document.getElementById("exp-1"));
    const dir = fileTree.getById(fileTree.visibleNodes[1]) as Dir;
    expect(dir.expanded).toBe(false);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    fireEvent.dragEnter(document.getElementById("exp-2"));

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(dir.expanded).toBe(false);
  });

  it("should not expand a directory after the default dragover timeout if the directory had a leave event in the meantime", async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragStart(document.getElementById("exp-0"));
    fireEvent.dragEnter(document.getElementById("exp-1"));

    const dir = fileTree.getById(fileTree.visibleNodes[1]) as Dir;
    expect(dir.expanded).toBe(false);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    fireEvent.dragEnd(document.getElementById("exp-0"));

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(dir.expanded).toBe(false);
  });

  it("should not expand a directory after the default dragover timeout if the directory had a drop event in the meantime", async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragStart(document.getElementById("exp-0"));
    fireEvent.dragEnter(document.getElementById("exp-1"));

    const dir = fileTree.getById(fileTree.visibleNodes[1]) as Dir;
    expect(dir.expanded).toBe(false);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    fireEvent.drop(document.getElementById("exp-2"));

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(dir.expanded).toBe(false);
    expect(handleChange).toHaveBeenCalledWith({
      type: "drop",
      node: fileTree.getById(fileTree.visibleNodes[0]),
      dir: fileTree.getById(fileTree.visibleNodes[2]),
    });
  });

  it("should do nothing on dragover", async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.dragOver(document.getElementById("exp-1"));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should not fire a drag "drop" event on a directory if there is no node', async () => {
    await waitForTree(fileTree);

    const handleChange = jest.fn();
    const [element, Component] = createComponent({ onChange: handleChange });
    render(<Component />, { container: element });

    fireEvent.drop(document.getElementById("exp-1"));

    expect(handleChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: "drop",
        dir: fileTree.getById(fileTree.visibleNodes[1]),
      })
    );
  });
});
