import type { FileTree } from "../file-tree";

export const mockFs = {
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
    { name: "/test/resolve-snapshot.js", type: "file" },
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

export function waitForTree(tree: FileTree<any>) {
  // @ts-expect-error: private access
  return Promise.all(tree.loadingBranches.values());
}

export function getNodesFromMockFs(
  parent: any,
  { createFile, createDir }: any
) {
  return mockFs[parent.data.name].map((stat) => {
    if (stat.type === "file") {
      return createFile({ name: stat.name });
    }

    return createDir({ name: stat.name });
  });
}
