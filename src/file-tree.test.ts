/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createFileTree, defaultComparator, isFile } from ".";
import type { Dir, File } from ".";
import type { Branch } from "./tree/branch";
import { nodesById } from "./tree/nodes-by-id";
import type { Tree } from "./tree/tree";
import { isLeaf } from "./tree/tree";

afterEach(() => {
  nodesById.length = 0;
});

describe("createFileTree()", () => {
  describe("structure", () => {
    it("should create a tree with visible nodes", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      expect(tree.visibleNodes.length).toBe(mockFs["/"].length);
      expect(tree.visibleNodes.length).toBe(mockFs["/"].length);
    });

    it('should have nodes with a "depth" property that is correct', async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      expect(tree.root.depth).toBe(0);
      expect(tree.getById(tree.root.nodes[0]).depth).toBe(1);
      expect(tree.getById(tree.root.nodes[1]).depth).toBe(1);

      await tree.expand(tree.getById(tree.root.nodes[0]) as Dir<any>);

      expect(
        tree.getById((tree.getById(tree.root.nodes[0]) as Branch).nodes[0])
          .depth
      ).toBe(2);
      expect(
        tree.getById((tree.getById(tree.root.nodes[0]) as Branch).nodes[1])
          .depth
      ).toBe(2);
    });

    it("should create dir paths based on a node parent", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.getById(tree.root.nodes[0]);
      expect(node.path).toBe("/.github");

      await tree.move(
        tree.getById(tree.root.nodes[0]),
        tree.nodesById.find((n) => n?.data.name === "/src") as Dir<any>
      );

      expect(tree.root.path).toBe("/");
      expect(node.path).toBe("/src/.github");
      expect(node.basename).toBe(".github");
    });

    it("should create file paths based on a node parent", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find((n) => n?.basename === ".gitignore");
      expect(node.path).toBe("/.gitignore");

      await tree.move(
        node,
        tree.nodesById.find((n) => n?.data.name === "/src") as Dir<any>
      );

      expect(node.path).toBe("/src/.gitignore");
      expect(node.basename).toBe(".gitignore");
    });
  });

  describe("expand/collapse", () => {
    it("should expand a nested directory", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find(
        (node): node is Dir => node?.data.name === "/.github"
      )!;
      await tree.expand(node);
      expect(tree.visibleNodes.length).toBe(
        mockFs["/"].length + mockFs["/.github"].length
      );
    });

    it("should expand a nested directory recursively", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find(
        (node): node is Dir => node?.data.name === "/src"
      )!;
      await tree.expand(node, { recursive: true });
      expect(tree.visibleNodes.length).toBe(
        mockFs["/"].length + mockFs["/src"].length + mockFs["/src/tree"].length
      );
    });

    it("should not expand a directory that is already visible", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find(
        (node): node is Dir => node?.data.name === "/src"
      )!;
      await tree.expand(node);
      await tree.expand(node);
      expect(tree.visibleNodes.length).toBe(
        mockFs["/"].length + mockFs["/src"].length
      );
    });

    it("should only expand once while waiting for promise to resolve", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find(
        (node): node is Dir => node?.data.name === "/src"
      )!;
      await Promise.race([tree.expand(node), tree.expand(node)]);
      expect(tree.visibleNodes.length).toBe(
        mockFs["/"].length + mockFs["/src"].length
      );
    });

    it("should expand and ensure visibility", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const srcNode = tree.nodesById.find(
        (node): node is Dir => node?.data.name === "/src"
      )!;
      await tree.expand(srcNode);
      tree.collapse(srcNode);
      await tree.expand(
        tree.getById(
          srcNode.nodes.find(
            (node) => tree.getById(node).data.name === "/src/tree"
          )!
        ) as Dir,
        { ensureVisible: true }
      );
      expect(tree.visibleNodes.length).toBe(
        mockFs["/"].length + mockFs["/src"].length + mockFs["/src/tree"].length
      );
    });

    it("should collapse a nested directory", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find(
        (node): node is Dir => node?.data.name === "/.github"
      )!;

      await tree.expand(node);
      tree.collapse(node);
      expect(tree.visibleNodes.length).toBe(mockFs["/"].length);
    });

    it("should keep a buried directory expanded", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find(
        (node): node is Dir => node?.data.name === "/src"
      )!;
      await tree.expand(node);

      const nestedNode = tree.getById(
        node.nodes.find((node) => tree.getById(node).data.name === "/src/tree")!
      ) as Dir;
      await tree.expand(nestedNode);
      tree.collapse(node);

      expect(nestedNode.expanded).toBe(true);
      await tree.expand(node);

      expect(tree.visibleNodes.length).toBe(
        mockFs["/"].length + mockFs["/src"].length + mockFs["/src/tree"].length
      );
      expect(tree.visibleNodes.length).toBe(
        mockFs["/"].length + mockFs["/src"].length + mockFs["/src/tree"].length
      );
    });
  });

  describe("remove", () => {
    it("should remove leaf node", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);

      const removedNode = tree.nodesById.find(
        (node) => node?.data.name === "/.gitignore"
      )!;
      tree.remove(removedNode);

      expect(tree.visibleNodes.length).toBe(mockFs["/"].length - 1);
      expect(tree.visibleNodes.indexOf(removedNode.id)).toBe(-1);
      expect(tree.visibleNodes.length).toBe(mockFs["/"].length - 1);
      expect(tree.visibleNodes.indexOf(removedNode.id)).toBe(-1);
    });

    it("should remove branch node", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);

      const removedNode = tree.nodesById.find(
        (node) => node?.data.name === "/src"
      ) as Dir;
      await tree.expand(removedNode);
      await tree.expand(
        tree.getById(
          removedNode.nodes!.find(
            (node) => tree.getById(node).data.name === "/src/tree"
          )!
        ) as Dir
      );
      tree.remove(removedNode);

      expect(tree.visibleNodes.length).toBe(mockFs["/"].length - 1);
      expect(tree.visibleNodes.indexOf(removedNode.id)).toBe(-1);
      expect(tree.visibleNodes.length).toBe(mockFs["/"].length - 1);
      expect(tree.visibleNodes.indexOf(removedNode.id)).toBe(-1);
    });
  });

  describe("events", () => {
    it("should invoke callback when visible nodes change", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      const handle = jest.fn();
      const unobserve = tree.flatView.observe(handle);

      await waitForTree(tree);
      expect(handle).toHaveBeenCalledTimes(0);
      expect(tree.visibleNodes.length).toBeGreaterThan(0);

      await tree.expand(tree.getById(tree.root.nodes[0]) as Dir<any>);
      expect(handle).toHaveBeenCalledTimes(2);
      expect(tree.visibleNodes.length).toBeGreaterThan(0);

      unobserve();
      await tree.expand(tree.getById(tree.root.nodes[0]) as Dir<any>);
      expect(handle).toHaveBeenCalledTimes(2);
      expect(tree.visibleNodes.length).toBeGreaterThan(0);
    });
  });

  describe("isVisible()", () => {
    it("should return true for visible nodes", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      expect(tree.isVisible(tree.root)).toBe(true);
      expect(tree.isVisible(tree.getById(tree.root.nodes[0]))).toBe(true);
      expect(tree.isVisible(tree.getById(tree.root.nodes[1]))).toBe(true);
    });

    it("should return false for invisible nodes", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);

      const branch = tree.nodesById.find(
        (node) => node?.data.name === "/src"
      )! as Dir<any>;

      await tree.expand(branch);
      expect(tree.isVisible(tree.getById(branch.nodes[0]))).toBe(true);

      tree.collapse(branch);
      expect(tree.isVisible(tree.getById(branch.nodes[0]))).toBe(false);
    });
  });

  describe("getNodeById()", () => {
    it("should return the node with the given id", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);

      expect(tree.getById(tree.root.id)).toBe(tree.root);
    });
  });

  describe("produce()", () => {
    it("should produce a new tree with sorting", async () => {
      const tree = createFileTree((_, { createDir, createFile }) => {
        return [
          createDir({ name: "/foo" }),
          createDir({ name: "/Bza" }),
          createDir({ name: "/bar" }),
          createFile({ name: "/a.py" }),
          createFile({ name: "/b.ts" }),
          createDir({ name: "/Foo" }),
          createDir({ name: "/Bar" }),
          createFile({ name: "/untitled.py" }),
          createFile({ name: "/Untitled.py" }),
        ];
      });

      await waitForTree(tree);

      tree.produce(tree.root, ({ draft }) => {
        draft.sort(defaultComparator);
      });

      expect(
        tree.root.nodes.map((node) => tree.getById(node).data.name)
      ).toEqual([
        "/bar",
        "/Bar",
        "/Bza",
        "/foo",
        "/Foo",
        "/a.py",
        "/b.ts",
        "/untitled.py",
        "/Untitled.py",
      ]);
    });

    it("should produce a new tree with branch insertion", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find(
        (node) => node?.data.name === "/.github"
      ) as Dir;
      await tree.expand(node);

      tree.produce(node, ({ createDir, insert }) => {
        insert(
          createDir({
            name: "/.github/pr-templates",
          })
        );
      });

      expect(node.nodes.length).toBe(mockFs["/.github"].length + 1);
      expect(node.nodes.map((node) => tree.getById(node).data.name)).toEqual([
        "/.github/pr-templates",
        "/.github/ISSUE_TEMPLATE.md",
        "/.github/PULL_REQUEST_TEMPLATE.md",
      ]);

      tree.produce(node, ({ createDir, insert }) => {
        insert(
          createDir({
            name: "/.github/issue-templates",
          })
        );
      });
      expect(node.nodes.length).toBe(mockFs["/.github"].length + 2);
      expect(node.nodes.map((node) => tree.getById(node).data.name)).toEqual([
        "/.github/issue-templates",
        "/.github/pr-templates",
        "/.github/ISSUE_TEMPLATE.md",
        "/.github/PULL_REQUEST_TEMPLATE.md",
      ]);
    });

    it("should produce a new tree with leaf insertion", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find(
        (node) => node?.data.name === "/.github"
      ) as Dir;
      await tree.expand(node);

      tree.produce(node, ({ createFile, insert }) => {
        insert(
          createFile({
            name: "/.github/pr-templates",
          })
        );
      });

      expect(node.nodes.length).toBe(mockFs["/.github"].length + 1);
      expect(node.nodes.map((node) => tree.getById(node).data.name)).toEqual([
        "/.github/ISSUE_TEMPLATE.md",
        "/.github/pr-templates",
        "/.github/PULL_REQUEST_TEMPLATE.md",
      ]);

      tree.produce(node, ({ createFile, insert }) => {
        insert(
          createFile({
            name: "/.github/issue-templates",
          })
        );
      });

      expect(node.nodes.length).toBe(mockFs["/.github"].length + 2);
      expect(node.nodes.map((node) => tree.getById(node).data.name)).toEqual([
        "/.github/ISSUE_TEMPLATE.md",
        "/.github/issue-templates",
        "/.github/pr-templates",
        "/.github/PULL_REQUEST_TEMPLATE.md",
      ]);
    });

    it("should revert a change to the draft tree", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find(
        (node) => node?.data.name === "/.github"
      ) as Dir;
      await tree.expand(node);

      tree.produce(node, ({ createFile, insert, revert }) => {
        insert(
          createFile({
            name: "/.github/pr-templates",
          })
        );

        revert();
      });

      expect(node.nodes.length).toBe(mockFs["/.github"].length);
      expect(node.nodes.map((node) => tree.getById(node).data.name)).toEqual([
        "/.github/ISSUE_TEMPLATE.md",
        "/.github/PULL_REQUEST_TEMPLATE.md",
      ]);
    });

    it("should produce a new tree by mutating the draft with an array method", () => {
      const tree = createFileTree(getNodesFromMockFs);

      tree.produce(tree.root, ({ draft, createDir }) => {
        draft.push(
          createDir({
            name: "/moo",
          })
        );
      });

      expect(tree.getById(tree.root.nodes[0]!).data.name).toEqual("/moo");
    });

    it("should produce a new tree by mutating the draft with an array index", () => {
      const tree = createFileTree(getNodesFromMockFs);

      tree.produce(tree.root, ({ draft, createDir }) => {
        draft[0] = createDir({
          name: "/moo",
        });
      });

      expect(tree.getById(tree.root.nodes[0]!).data.name).toEqual("/moo");
    });

    it("should revert the draft with an array index", async () => {
      const tree = createFileTree(getNodesFromMockFs);
      await waitForTree(tree);

      tree.produce(tree.root, ({ draft, createDir, revert }) => {
        draft[0] = createDir({
          name: "/moo",
        });

        revert();
      });

      expect(tree.getById(tree.root.nodes[0]!).data.name).not.toEqual("/moo");
    });
  });

  describe("move()", () => {
    it("should move a branch from one branch to another", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find(
        (node) => node?.data.name === "/src"
      ) as Dir;
      const toBranch = tree.nodesById.find(
        (node) => node?.data.name === "/.husky"
      ) as Dir;
      await tree.expand(node);
      const nodeB = tree.getById(
        node.nodes.find((node) => tree.getById(node).data.name === "/src/tree")
      ) as Dir;
      await tree.expand(nodeB);
      await tree.move(node, toBranch);

      expect(
        toBranch.nodes.map((node) => tree.getById(node).data.name)
      ).toEqual(["/.husky/hooks", "/src"]);

      expect(
        [...tree.visibleNodes].map((id) => tree.getById(id).data.name)
      ).toStrictEqual([
        "/.github",
        "/.husky",
        "/.husky/hooks",
        "/src",
        "/src/tree",
        "/src/tree/tree.test.ts",
        "/src/tree/tree.ts",
        "/src/file-tree.ts",
        "/src/index.ts",
        "/src/path-fx.ts",
        "/test",
        "/types",
        "/.gitignore",
        "/babel.config.js",
        "/CODE_OF_CONDUCT.md",
        "/CONTRIBUTING.md",
        "/LICENSE",
        "/package.json",
        "/pnpm-lock.yaml",
        "/README.md",
        "/tsconfig.json",
      ]);
    });

    it("should move a leaf from one branch to another", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find(
        (node) => node?.data.name === "/.gitignore"
      ) as File;
      const toBranch = tree.nodesById.find(
        (node) => node?.data.name === "/.husky"
      ) as Dir;
      await tree.move(node, toBranch);

      expect(
        toBranch.nodes.map((node) => tree.getById(node).data.name)
      ).toEqual(["/.husky/hooks", "/.gitignore"]);
      expect(
        [...tree.visibleNodes].map((id) => tree.getById(id).data.name)
      ).toStrictEqual([
        "/.github",
        "/.husky",
        "/.husky/hooks",
        "/.gitignore",
        ...[...mockFs["/"]]
          .splice(
            mockFs["/"].findIndex((stat) => stat.name === "/.husky") + 1,
            mockFs["/"].findIndex((stat) => stat.name === "/.gitignore") - 2
          )
          .map((stat) => stat.name),
        ...[...mockFs["/"]]
          .splice(
            mockFs["/"].findIndex((stat) => stat.name === "/.gitignore") + 1
          )
          .map((stat) => stat.name),
      ]);
    });

    it("should not move a node if the target is the same branch as its current parent", async () => {
      const tree = createFileTree(getNodesFromMockFs);

      await waitForTree(tree);
      const node = tree.nodesById.find(
        (node) => node?.data.name === "/.github"
      ) as Dir;
      const initialNodes = tree.root.nodes;
      await tree.move(node, tree.root);

      expect(initialNodes).toBe(tree.root.nodes);
      expect(tree.root.nodes.length).toBe(mockFs["/"].length);
    });
  });

  it("should dispose", async () => {
    const tree = createFileTree(getNodesFromMockFs);
    await waitForTree(tree);
    tree.dispose();
    expect(nodesById[tree.root.id]).toBe(undefined);
  });

  it("should restore from a snapshot", async () => {
    const tree = createFileTree(getNodesFromMockFs, {
      restoreFromSnapshot: {
        expandedPaths: ["/.github"],
        buriedPaths: ["/.husky/hooks"],
        version: 1,
      },
    });
    await waitForTree(tree);
    const dir = tree.getById(tree.visibleNodes[0]) as Dir;
    expect(dir.expanded).toBe(true);
    expect(dir.nodes).not.toBeUndefined();

    const husky = tree.getById(tree.root.nodes[1]) as Dir;
    await tree.expand(husky);

    const huskyHooks = tree.getById(husky.nodes[0]) as Dir;
    expect(huskyHooks.expanded).toBe(true);
    expect(huskyHooks.nodes).not.toBeUndefined();
  });
});

describe("file tree actions", () => {
  let tree = createFileTree(() => []);

  afterEach(() => {
    tree = createFileTree(() => []);
  });

  it("should create a file and sort", () => {
    tree.newFile(tree.root, { name: "foo" });
    expect(tree.getById(tree.root.nodes[0]).data.name).toBe("foo");

    tree.newFile(tree.root, { name: "bar" });
    expect(tree.getById(tree.root.nodes[0]).data.name).toBe("bar");
  });

  it("should create a directory and sort", () => {
    tree.newDir(tree.root, { name: "foo" });
    expect(tree.getById(tree.root.nodes[0]).data.name).toBe("foo");

    tree.newDir(tree.root, { name: "bar" });
    expect(tree.getById(tree.root.nodes[0]).data.name).toBe("bar");
  });

  it("should move a file and sort", async () => {
    tree.newDir(tree.root, { name: "bar" });
    tree.newDir(tree.root, { name: "foo" });
    tree.newFile(tree.root, { name: "a" });
    tree.newFile(tree.root, { name: "b" });

    const firstDir = tree.getById(tree.root.nodes[0]) as Dir;
    await tree.expand(firstDir);
    await tree.move(tree.nodesById.find((n) => n?.basename === "b")!, firstDir);
    await tree.move(tree.nodesById.find((n) => n?.basename === "a")!, firstDir);

    expect(tree.getById(firstDir.nodes[0]).data.name).toBe("a");
  });

  it("should rename and sort", async () => {
    tree.newFile(tree.root, { name: "foo" });
    tree.newFile(tree.root, { name: "bar" });

    expect(tree.getById(tree.root.nodes[0]).data.name).toBe("bar");

    tree.rename(tree.nodesById.find((n) => n?.basename === "foo")!, "a");

    expect(tree.getById(tree.root.nodes[0]).data.name).toBe("a");
  });

  it("should remove a node", async () => {
    tree.newFile(tree.root, { name: "foo" });

    expect(tree.root.nodes.length).toBe(1);

    tree.remove(tree.nodesById.find((n) => n?.basename === "foo")!);
    expect(tree.root.nodes.length).toBe(0);
  });

  it("should produce and sort", async () => {
    tree.produce(tree.root, (context) => {
      context.insert(context.createDir({ name: "foo" }));
      context.insert(context.createDir({ name: "bar" }));
    });

    expect(tree.getById(tree.root.nodes[0]).data.name).toBe("bar");
  });
});

describe("isLeaf()", () => {
  it("should return `true` for leaf nodes, `false` for branch nodes", async () => {
    const tree = createFileTree(getNodesFromMockFs);

    await waitForTree(tree);
    expect(isLeaf(tree.root)).toBe(false);
    expect(
      isLeaf(tree.nodesById.find((node) => node?.data.name === "/.gitignore"))
    ).toBe(true);
  });
});

describe("isFile()", () => {
  it("should return `true` for file nodes, `false` for dir nodes", async () => {
    const tree = createFileTree(getNodesFromMockFs);

    await waitForTree(tree);
    expect(isFile(tree.root)).toBe(false);
    expect(
      isFile(tree.nodesById.find((node) => node?.data.name === "/.gitignore"))
    ).toBe(true);
  });
});

function waitForTree(tree: Tree<any>) {
  // @ts-expect-error: private access
  return Promise.all(tree.loadingBranches.values());
}

function getNodesFromMockFs(parent: any, { createFile, createDir }: any) {
  return mockFs[parent.data.name].map((stat) => {
    if (stat.type === "file") {
      return createFile({ name: stat.name });
    }

    return createDir({ name: stat.name });
  });
}

const mockFs = {
  "/": [
    { name: "/.github", type: "dir" },
    { name: "/.husky", type: "dir" },
    { name: "/src", type: "dir" },
    { name: "/test", type: "dir" },
    { name: "/types", type: "dir" },
    { name: "/.gitignore", type: "file" },
    { name: "/babel.config.js", type: "file" },
    { name: "/CODE_OF_CONDUCT.md", type: "file" },
    { name: "/CONTRIBUTING.md", type: "file" },
    { name: "/LICENSE", type: "file" },
    { name: "/package.json", type: "file" },
    { name: "/pnpm-lock.yaml", type: "file" },
    { name: "/README.md", type: "file" },
    { name: "/tsconfig.json", type: "file" },
  ],
  "/.github": [
    { name: "/.github/ISSUE_TEMPLATE.md", type: "file" },
    { name: "/.github/PULL_REQUEST_TEMPLATE.md", type: "file" },
  ],
  "/.husky": [{ name: "/.husky/hooks", type: "dir" }],
  "/.husky/hooks": [{ name: "/.husky/hooks/pre-commit", type: "file" }],
  "/src": [
    { name: "/src/tree", type: "dir" },
    { name: "/src/index.ts", type: "file" },
    { name: "/src/file-tree.ts", type: "file" },
    { name: "/src/path-fx.ts", type: "file" },
  ],
  "/src/tree": [
    { name: "/src/tree/tree.ts", type: "file" },
    { name: "/src/tree/tree.test.ts", type: "file" },
  ],
  "/test": [
    { name: "/test/resolve-snapshot.js" },
    { name: "/test/setup.ts", type: "file" },
  ],
  "/types": [
    { name: "/types/index.d.ts", type: "file" },
    { name: "/types/file-tree.d.ts", type: "file" },
    { name: "/types/path-fx.d.ts", type: "file" },
    { name: "/types/tree", type: "dir" },
  ],
  "/types/tree": [{ name: "/types/tree/tree.d.ts", type: "file" }],
};
