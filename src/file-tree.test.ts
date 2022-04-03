import { createFileTree, Fs, Tree } from ".";
import { comparator } from "./file-tree";
import type { FileTreeData } from "./file-tree";
import type { Branch } from "./tree/branch";

describe("createFileTree()", () => {
  describe("structure", () => {
    it("should create a tree with visible nodes", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);
      expect(getFlatViewMap(tree).get(tree.root.id).length).toBe(
        mockFs["/"].length
      );
      expect(tree.visibleTreeNodes.length).toBe(mockFs["/"].length);
    });

    it('should have nodes with a "depth" property that is correct', async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);
      expect(tree.root.depth).toBe(0);
      expect(tree.root.nodes[0].depth).toBe(1);
      expect(tree.root.nodes[1].depth).toBe(1);

      await tree.expand(tree.root.nodes[0] as Branch<any>);

      expect((tree.root.nodes[0] as Branch).nodes[0].depth).toBe(2);
      expect((tree.root.nodes[0] as Branch).nodes[1].depth).toBe(2);
    });
  });

  describe("expand/collapse", () => {
    it("should expand a nested directory", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);
      const node = tree.root.nodes.find(
        (node): node is Branch<FileTreeData> => node.data.path === "/.github"
      )!;
      await tree.expand(node);
      expect(tree.visibleTreeNodes.length).toBe(
        mockFs["/"].length + mockFs["/.github"].length
      );

      expect(getFlatViewMap(tree).get(node.id)).toBeUndefined();
    });

    it("should expand a nested directory recursively", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);
      const node = tree.root.nodes.find(
        (node): node is Branch<FileTreeData> => node.data.path === "/src"
      )!;
      await tree.expand(node, { recursive: true });
      expect(tree.visibleTreeNodes.length).toBe(
        mockFs["/"].length + mockFs["/src"].length + mockFs["/src/tree"].length
      );

      expect(getFlatViewMap(tree).get(node.id)).toBeUndefined();
    });

    it("should not expand a directory that is already visible", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);
      const node = tree.root.nodes.find(
        (node): node is Branch<FileTreeData> => node.data.path === "/src"
      )!;
      await tree.expand(node);
      await tree.expand(node);
      expect(tree.visibleTreeNodes.length).toBe(
        mockFs["/"].length + mockFs["/src"].length
      );
    });

    it("should only expand once while waiting for promise to resolve", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);
      const node = tree.root.nodes.find(
        (node): node is Branch<FileTreeData> => node.data.path === "/src"
      )!;
      await Promise.race([tree.expand(node), tree.expand(node)]);
      expect(tree.visibleTreeNodes.length).toBe(
        mockFs["/"].length + mockFs["/src"].length
      );
    });

    it("should expand and ensure visibility", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);
      const srcNode = tree.root.nodes.find(
        (node): node is Branch<FileTreeData> => node.data.path === "/src"
      )!;
      await tree.expand(srcNode);
      tree.collapse(srcNode);
      await tree.expand(
        srcNode.nodes.find(
          (node): node is Branch<FileTreeData> => node.data.path === "/src/tree"
        )!,
        { ensureVisible: true }
      );
      expect(tree.visibleTreeNodes.length).toBe(
        mockFs["/"].length + mockFs["/src"].length + mockFs["/src/tree"].length
      );
    });

    it("should collapse a nested directory", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);
      const node = tree.root.nodes.find(
        (node): node is Branch<FileTreeData> => node.data.path === "/.github"
      )!;

      await tree.expand(node);
      tree.collapse(node);
      expect(tree.visibleTreeNodes.length).toBe(mockFs["/"].length);
    });

    it("should keep a buried directory expanded", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);
      const node = tree.root.nodes.find(
        (node): node is Branch<FileTreeData> => node.data.path === "/src"
      )!;
      await tree.expand(node);

      const nestedNode = node.nodes.find(
        (node): node is Branch<FileTreeData> => node.data.path === "/src/tree"
      )!;
      await tree.expand(nestedNode);
      tree.collapse(node);

      expect(tree.visibleTreeNodes.length).toBe(mockFs["/"].length);
      expect(getFlatViewMap(tree).get(node.id).length).toBe(
        mockFs["/src"].length + mockFs["/src/tree"].length
      );

      await tree.expand(node);

      expect(tree.visibleTreeNodes.length).toBe(
        mockFs["/"].length + mockFs["/src"].length + mockFs["/src/tree"].length
      );
      expect(getFlatViewMap(tree).get(tree.root.id).length).toBe(
        mockFs["/"].length + mockFs["/src"].length + mockFs["/src/tree"].length
      );
      expect(getFlatViewMap(tree).get(node.id)).toBeUndefined();
    });
  });

  describe("remove", () => {
    it("should remove leaf node", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);

      const removedNode = tree.root.nodes.find(
        (node) => node.data.path === "/.gitignore"
      )!;
      tree.removeNode(removedNode);

      expect(tree.visibleTreeNodes.length).toBe(mockFs["/"].length - 1);
      expect(tree.visibleTreeNodes.indexOf(removedNode.id)).toBe(-1);
      expect(getFlatViewMap(tree).get(tree.root.id).length).toBe(
        mockFs["/"].length - 1
      );
      expect(
        getFlatViewMap(tree).get(tree.root.id).indexOf(removedNode.id)
      ).toBe(-1);
    });

    it("should remove branch node", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);

      const removedNode = tree.root.nodes.find(
        (node) => node.data.path === "/src"
      ) as Branch<FileTreeData>;
      await tree.expand(removedNode);
      await tree.expand(
        removedNode.nodes!.find(
          (node) => node.data.path === "/src/tree"
        )! as Branch<any>
      );
      tree.removeNode(removedNode);

      expect(tree.visibleTreeNodes.length).toBe(mockFs["/"].length - 1);
      expect(tree.visibleTreeNodes.indexOf(removedNode.id)).toBe(-1);
      expect(getFlatViewMap(tree).get(tree.root.id).length).toBe(
        mockFs["/"].length - 1
      );
      expect(
        getFlatViewMap(tree).get(tree.root.id).indexOf(removedNode.id)
      ).toBe(-1);
    });
  });

  describe("events", () => {
    it("should invoke callback when visible nodes change", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      const handle = jest.fn();
      tree.onVisibleNodesChange(handle);

      await waitForTree(tree);
      expect(handle).toHaveBeenCalledTimes(0);

      await tree.expand(tree.root.nodes[0] as Branch<any>);
      expect(handle).toHaveBeenCalledTimes(2);

      tree.collapse(tree.root.nodes[0] as Branch<any>);
      expect(handle).toHaveBeenCalledTimes(3);
    });
  });

  describe("isVisible()", () => {
    it("should return true for visible nodes", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);
      expect(tree.isVisible(tree.root)).toBe(true);
      expect(tree.isVisible(tree.root.nodes[0])).toBe(true);
      expect(tree.isVisible(tree.root.nodes[1])).toBe(true);
    });

    it("should return false for invisible nodes", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);

      const branch = tree.root.nodes.find(
        (node) => node.data.path === "/src"
      )! as Branch<any>;

      await tree.expand(branch);
      expect(tree.isVisible(branch.nodes[0])).toBe(true);

      tree.collapse(branch);
      expect(tree.isVisible(branch.nodes[0])).toBe(false);
    });
  });

  describe("isLeaf()", () => {
    it("should return `true` for leaf nodes, `false` for branch nodes", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);
      expect(Tree.isLeaf(tree.root)).toBe(false);
      expect(
        Tree.isLeaf(
          tree.root.nodes.find((node) => node.data.path === "/.gitignore")
        )
      ).toBe(true);
    });
  });

  describe("getNodeById()", () => {
    it("should return the node with the given id", async () => {
      const tree = createFileTree(
        ({ path }) => {
          return mockFs[path];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);

      expect(tree.getNodeById(tree.root.id)).toBe(tree.root);
      expect(tree.getNodeById(tree.root.nodes[0].id)).toBe(tree.root.nodes[0]);
    });
  });

  describe("produce()", () => {
    it("should produce a new tree with sorting", async () => {
      const tree = createFileTree(
        () => {
          return [
            { path: "/foo", type: Fs.Dir },
            { path: "/Bza", type: Fs.Dir },
            { path: "/bar", type: Fs.Dir },
            { path: "/a.py", type: Fs.File },
            { path: "/b.ts", type: Fs.File },
            { path: "/Foo", type: Fs.Dir },
            { path: "/Bar", type: Fs.Dir },
            { path: "/untitled.py", type: Fs.File },
            { path: "/Untitled.py", type: Fs.File },
          ];
        },
        {
          root: {
            path: "/",
          },
        }
      );

      await waitForTree(tree);

      tree.produce(tree.root, (tree) => {
        return tree.sort(comparator);
      });

      expect(tree.root.nodes.map((node) => node.data.path)).toEqual([
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
      const tree = createFileTree(({ path }) => mockFs[path]);

      await waitForTree(tree);
      const node = tree.root.nodes.find(
        (node) => node.data.path === "/.github"
      ) as Branch<FileTreeData>;
      await tree.expand(node);

      tree.produce(node, ({ insertBranch }) => {
        insertBranch({
          path: "/.github/pr-templates",
          type: Fs.Dir,
        });
      });

      expect(node.nodes.length).toBe(mockFs["/.github"].length + 1);
      expect(node.nodes.map((node) => node.data.path)).toEqual([
        "/.github/ISSUE_TEMPLATE.md",
        "/.github/PULL_REQUEST_TEMPLATE.md",
        "/.github/pr-templates",
      ]);

      tree.produce(node, ({ insertBranch }) => {
        insertBranch(
          {
            path: "/.github/issue-templates",
            type: Fs.Dir,
          },
          1
        );
      });
      expect(node.nodes.length).toBe(mockFs["/.github"].length + 2);
      expect(node.nodes.map((node) => node.data.path)).toEqual([
        "/.github/ISSUE_TEMPLATE.md",
        "/.github/issue-templates",
        "/.github/PULL_REQUEST_TEMPLATE.md",
        "/.github/pr-templates",
      ]);
    });

    it("should produce a new tree with leaf insertion", async () => {
      const tree = createFileTree(({ path }) => mockFs[path]);

      await waitForTree(tree);
      const node = tree.root.nodes.find(
        (node) => node.data.path === "/.github"
      ) as Branch<FileTreeData>;
      await tree.expand(node);

      tree.produce(node, ({ insertLeaf }) => {
        insertLeaf({
          path: "/.github/pr-templates",
          type: Fs.File,
        });
      });

      expect(node.nodes.length).toBe(mockFs["/.github"].length + 1);
      expect(node.nodes.map((node) => node.data.path)).toEqual([
        "/.github/ISSUE_TEMPLATE.md",
        "/.github/PULL_REQUEST_TEMPLATE.md",
        "/.github/pr-templates",
      ]);

      tree.produce(node, ({ insertLeaf }) => {
        insertLeaf(
          {
            path: "/.github/issue-templates",
            type: Fs.File,
          },
          1
        );
      });
      expect(node.nodes.length).toBe(mockFs["/.github"].length + 2);
      expect(node.nodes.map((node) => node.data.path)).toEqual([
        "/.github/ISSUE_TEMPLATE.md",
        "/.github/issue-templates",
        "/.github/PULL_REQUEST_TEMPLATE.md",
        "/.github/pr-templates",
      ]);
    });

    it("should revert a change to the draft tree", async () => {
      const tree = createFileTree(({ path }) => mockFs[path]);

      await waitForTree(tree);
      const node = tree.root.nodes.find(
        (node) => node.data.path === "/.github"
      ) as Branch<FileTreeData>;
      await tree.expand(node);

      tree.produce(node, ({ insertLeaf, revert }) => {
        insertLeaf({
          path: "/.github/pr-templates",
          type: Fs.File,
        });

        revert();
      });

      expect(node.nodes.length).toBe(mockFs["/.github"].length);
      expect(node.nodes.map((node) => node.data.path)).toEqual([
        "/.github/ISSUE_TEMPLATE.md",
        "/.github/PULL_REQUEST_TEMPLATE.md",
      ]);
    });

    it("should produce a new tree by mutating the draft with an array method", () => {
      const tree = createFileTree(({ path }) => mockFs[path]);

      tree.produce(tree.root, ({ draft, createBranch }) => {
        draft.push(
          createBranch({
            path: "/moo",
            type: Fs.Dir,
          })
        );
      });

      expect(tree.root.nodes[0]!.data.path).toEqual("/moo");
    });

    it("should produce a new tree by mutating the draft with an array index", () => {
      const tree = createFileTree(({ path }) => mockFs[path]);

      tree.produce(tree.root, ({ draft, createBranch }) => {
        draft[0] = createBranch({
          path: "/moo",
          type: Fs.Dir,
        });
      });

      expect(tree.root.nodes[0]!.data.path).toEqual("/moo");
    });

    it("should revert the draft with an array index", async () => {
      const tree = createFileTree(({ path }) => mockFs[path]);
      await waitForTree(tree);

      tree.produce(tree.root, ({ draft, createBranch, revert }) => {
        draft[0] = createBranch({
          path: "/moo",
          type: Fs.Dir,
        });

        revert();
      });

      expect(tree.root.nodes[0]!.data.path).not.toEqual("/moo");
    });
  });
});

function waitForTree(tree: Tree<any>) {
  // @ts-expect-error: private access
  return Promise.all(tree.pendingLoadChildrenRequests.values());
}

function getFlatViewMap(tree: Tree<any>) {
  // @ts-expect-error: private access
  return tree.flatViewMap;
}

const mockFs = {
  "/": [
    { path: "/.github", type: Fs.Dir },
    { path: "/.husky", type: Fs.Dir },
    { path: "/src", type: Fs.Dir },
    { path: "/test", type: Fs.Dir },
    { path: "/types", type: Fs.Dir },
    { path: "/.gitignore", type: Fs.File },
    { path: "/babel.config.js", type: Fs.File },
    { path: "/CODE_OF_CONDUCT.md", type: Fs.File },
    { path: "/CONTRIBUTING.md", type: Fs.File },
    { path: "/LICENSE", type: Fs.File },
    { path: "/package.json", type: Fs.File },
    { path: "/pnpm-lock.yaml", type: Fs.File },
    { path: "/README.md", type: Fs.File },
    { path: "/tsconfig.json", type: Fs.File },
  ],
  "/.github": [
    { path: "/.github/ISSUE_TEMPLATE.md", type: Fs.File },
    { path: "/.github/PULL_REQUEST_TEMPLATE.md", type: Fs.File },
  ],
  "/.husky": [{ path: "/.husky/hooks", type: Fs.Dir }],
  "/.husky/hooks": [{ path: "/.husky/hooks/pre-commit", type: Fs.File }],
  "/src": [
    { path: "/src/index.ts", type: Fs.File },
    { path: "/src/file-tree.ts", type: Fs.File },
    { path: "/src/path-fx.ts", type: Fs.File },
    { path: "/src/tree", type: Fs.Dir },
  ],
  "/src/tree": [
    { path: "/src/tree/tree.ts", type: Fs.File },
    { path: "/src/tree/tree.test.ts", type: Fs.File },
  ],
  "/test": [
    { path: "/test/resolve-snapshot.js", type: Fs.File },
    { path: "/test/setup.ts", type: Fs.File },
  ],
  "/types": [
    { path: "/types/index.d.ts", type: Fs.File },
    { path: "/types/file-tree.d.ts", type: Fs.File },
    { path: "/types/path-fx.d.ts", type: Fs.File },
    { path: "/types/tree", type: Fs.Dir },
  ],
  "/types/tree": [{ path: "/types/tree/tree.d.ts", type: Fs.File }],
};
