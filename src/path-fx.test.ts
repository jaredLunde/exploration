import * as pathFx from "./path-fx";

describe("join()", () => {
  it("should join paths", () => {
    expect(pathFx.join("/foo", "bar")).toBe("/foo/bar");
    expect(pathFx.join("/foo", "/bar")).toBe("/foo/bar");
    expect(pathFx.join("/foo", "bar/")).toBe("/foo/bar");
    expect(pathFx.join("/foo", "/bar/")).toBe("/foo/bar");
    expect(pathFx.join("/foo", "bar/baz")).toBe("/foo/bar/baz");
    expect(pathFx.join("/foo", "/bar/baz")).toBe("/foo/bar/baz");
    expect(pathFx.join("/foo", "bar/baz/")).toBe("/foo/bar/baz");
    expect(pathFx.join("/foo", "/bar/baz/")).toBe("/foo/bar/baz");
    expect(pathFx.join("/foo", "bar/baz/qux")).toBe("/foo/bar/baz/qux");
    expect(pathFx.join("/foo", "/bar/baz/qux")).toBe("/foo/bar/baz/qux");
    expect(pathFx.join("/foo", "bar/baz/qux/")).toBe("/foo/bar/baz/qux");
    expect(pathFx.join("/foo", "/bar/baz/qux/")).toBe("/foo/bar/baz/qux");
  });

  it("should join paths lower in the tree", () => {
    expect(pathFx.join("/foo/bar", "../baz")).toBe("/foo/baz");
    expect(pathFx.join("/foo/bar", "..")).toBe("/foo");
    expect(pathFx.join("/foo/bar", "./")).toBe("/foo/bar");
    expect(pathFx.join("/foo/bar", "../../baz")).toBe("/baz");
    expect(pathFx.join("/foo/bar", "../../baz/qux")).toBe("/baz/qux");
    expect(pathFx.join("/foo/bar", "../../../baz/qux/")).toBe("/baz/qux");
  });
});
describe("relative()", () => {
  it("should return a relative path", () => {
    expect(pathFx.relative("/foo/bar", "/foo/bar")).toBe("");
    expect(pathFx.relative("/foo/bar", "/bar/")).toBe("../../bar");
    expect(pathFx.relative("/foo/bar", "/foo/bar/baz")).toBe("baz");
    expect(pathFx.relative("/foo/bar/baz", "/foo/bar")).toBe("..");
    expect(pathFx.relative("/foo/bar/baz/qux", "/foo/bar")).toBe("../..");
    expect(pathFx.relative("/foo/bar", "/foo/bar/baz/qux")).toBe("baz/qux");
    expect(pathFx.relative("/foo/bar", "/foo/bar/baz/qux/")).toBe("baz/qux");
    expect(pathFx.relative("/foo/bar", "/foo/bar/baz/qux/quux")).toBe(
      "baz/qux/quux"
    );
    expect(pathFx.relative("/foo/bar", "/foo/bar/baz/qux/quux/")).toBe(
      "baz/qux/quux"
    );
    expect(pathFx.relative("/foo/bar", "/foo/bar/baz/qux/quux/quuz")).toBe(
      "baz/qux/quux/quuz"
    );
    expect(pathFx.relative("/foo/bar", "/foo/bar/baz/qux/quux/quuz/")).toBe(
      "baz/qux/quux/quuz"
    );
  });

  it('should throw error if "from" or "to" paths are not absolute', () => {
    expect(() => pathFx.relative("foo/bar", "/baz/qux")).toThrowError(
      "Paths must be absolute"
    );
    expect(() => pathFx.relative("/foo/bar", "baz/qux")).toThrowError(
      "Paths must be absolute"
    );
  });
});

describe("split()", () => {
  it("should split a path", () => {
    expect(pathFx.split("/")).toEqual([]);
    expect(pathFx.split("foo")).toEqual(["foo"]);
    expect(pathFx.split("/foo")).toEqual(["foo"]);
    expect(pathFx.split("foo/bar")).toEqual(["foo", "bar"]);
    expect(pathFx.split("/foo/bar")).toEqual(["foo", "bar"]);
    expect(pathFx.split("/foo/bar/baz")).toEqual(["foo", "bar", "baz"]);
  });
});

describe("isPathInside()", () => {
  it("should return true if the path is inside the base path", () => {
    expect(pathFx.isPathInside("/foo/bar", "/foo")).toBe(true);
    expect(pathFx.isPathInside("/foo/bar", "/foo/bar")).toBe(true);
  });

  it("should return false if the path is not inside the base path", () => {
    expect(pathFx.isPathInside("/foo/bar", "/foo/bar/baz/qux")).toBe(false);
    expect(pathFx.isPathInside("/foo/bar", "/bar")).toBe(false);
  });
});

describe("depth()", () => {
  it("should return the depth of the path", () => {
    expect(pathFx.depth("")).toBe(0);
    expect(pathFx.depth("/foo/bar")).toBe(2);
    expect(pathFx.depth("/foo/bar/baz")).toBe(3);
    expect(pathFx.depth("/foo/bar/baz/qux")).toBe(4);
  });
});

describe("basename()", () => {
  it("should return the basename of the path", () => {
    expect(pathFx.basename("/foo/bar")).toBe("bar");
    expect(pathFx.basename("/foo/bar/baz")).toBe("baz");
    expect(pathFx.basename("/foo/bar/baz/qux.ts")).toBe("qux.ts");
  });
});

describe("extname()", () => {
  it("should return the extname of the path", () => {
    expect(pathFx.extname("/foo/bar")).toBe("");
    expect(pathFx.extname("/foo/bar/baz")).toBe("");
    expect(pathFx.extname("/foo/bar/baz/qux.ts")).toBe(".ts");
    expect(pathFx.extname("/foo/bar/baz/qux.test.ts")).toBe(".ts");
  });
});

describe("dirname()", () => {
  it("should return the dirname of the path", () => {
    expect(pathFx.dirname("foo/bar")).toBe("foo");
    expect(pathFx.dirname("foo")).toBe(".");
    expect(pathFx.dirname("/foo")).toBe("/");
    expect(pathFx.dirname("/foo/bar")).toBe("/foo");
    expect(pathFx.dirname("/foo/bar/baz")).toBe("/foo/bar");
    expect(pathFx.dirname("/foo/bar/baz/qux.ts")).toBe("/foo/bar/baz");
  });
});

describe("normalize()", () => {
  it("should normalize the path", () => {
    expect(pathFx.normalize("/foo/bar/baz/qux/")).toBe("/foo/bar/baz/qux");
    expect(pathFx.normalize("/foo/bar/baz/qux/../../../")).toBe("/foo");
  });
});
