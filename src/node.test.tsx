import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import type { Dir } from ".";
import { createFileTree, Node } from ".";
import { getNodesFromMockFs, waitForTree } from "./test/utils";
import { useRovingFocus } from "./use-roving-focus";

describe("<Node>", () => {
  let fileTree = createFileTree(getNodesFromMockFs);

  afterEach(() => {
    fileTree = createFileTree(getNodesFromMockFs);
  });

  it("should render", async () => {
    await waitForTree(fileTree);
    const element = render(
      <Node
        index={0}
        tree={fileTree}
        node={fileTree.getById(fileTree.visibleNodes[0])}
        style={{ height: 24 }}
      >
        Hello
      </Node>
    );

    expect(element.asFragment().firstChild).toHaveAttribute("id", "exp-0");
    expect(element.asFragment().firstChild).toHaveClass("depth-1");
    expect(element.asFragment().firstChild).toHaveStyle({ height: "24px" });
  });

  it("should toggle collapsed onClick if it is a directory", async () => {
    await waitForTree(fileTree);
    const node = fileTree.getById(fileTree.visibleNodes[0]) as Dir;
    const Component = () => {
      const rovingFocus = useRovingFocus(fileTree);

      return (
        <Node
          index={0}
          tree={fileTree}
          node={node}
          style={{ height: 24 }}
          plugins={[rovingFocus]}
        >
          Hello
        </Node>
      );
    };

    render(<Component />);

    fireEvent.click(screen.getByRole("button"));
    expect(node.expanded).toBe(true);
    expect(document.activeElement as any).toBe(screen.getByRole("button"));

    fireEvent.click(screen.getByRole("button"));
    expect(node.expanded).toBe(false);
  });

  it("should toggle not expand directory on meta clicks", async () => {
    await waitForTree(fileTree);
    const node = fileTree.getById(fileTree.visibleNodes[0]) as Dir;
    const Component = () => {
      const rovingFocus = useRovingFocus(fileTree);

      return (
        <Node
          index={0}
          tree={fileTree}
          node={node}
          style={{ height: 24 }}
          plugins={[rovingFocus]}
        >
          Hello
        </Node>
      );
    };

    render(<Component />);

    fireEvent.click(screen.getByRole("button"), { metaKey: true });
    expect(node.expanded).toBe(false);
    expect(document.activeElement as any).toBe(screen.getByRole("button"));

    fireEvent.click(screen.getByRole("button"), { shiftKey: true });
    expect(node.expanded).toBe(false);

    fireEvent.click(screen.getByRole("button"), { altKey: true });
    expect(node.expanded).toBe(false);

    fireEvent.click(screen.getByRole("button"), { ctrlKey: true });
    expect(node.expanded).toBe(false);

    fireEvent.click(screen.getByRole("button"), { button: 2 });
    expect(node.expanded).toBe(false);
  });
});
