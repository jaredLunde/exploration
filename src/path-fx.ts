export const SEP = "/";
const SEP_NEGATE_RE = /[^/]+/g;
const TRAILING_SEP_RE = /\/$/;

/**
 * Returns `true` if the path is relative.
 *
 * @param path - The path to check
 */
export function isRelative(path: string): boolean {
  return path[0] !== SEP;
}

/**
 * Join all arguments together and normalize the resulting path.
 *
 * @param paths - The paths to join
 */
export function join(...paths: string[]) {
  const composed = [];
  const hasLeadingSlash = paths[0][0] === SEP;
  const lastPath = paths[paths.length - 1];
  const hasTrailingSlash = lastPath[lastPath.length - 1] === SEP;

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const parts = split(path);

    for (let j = 0; j < parts.length; j++) {
      const part = parts[j];

      if (part === ".") {
        continue;
      } else if (part.length === 2 && part[0] === "." && part[1] === ".") {
        composed.pop();
      } else {
        composed.push(part);
      }
    }
  }

  if (hasLeadingSlash) {
    composed.unshift("");
  }

  if (hasTrailingSlash) {
    composed.push("");
  }

  return composed.join(SEP);
}

/**
 * Solve the relative path from `from` to `to`. Paths must be absolute.
 *
 * @param from - The absolute path to start from
 * @param to - The absolute path to solve to
 */
export function relative(from: string, to: string) {
  if (isRelative(from) || isRelative(to)) {
    throw new Error(`Paths must be absolute`);
  }

  const fromFrags = split(from);
  const toFrags = split(to);
  const hasTrailingSep = to[to.length - 1] === SEP;

  for (let i = 0; i < fromFrags.length; i++) {
    const fromFrag = fromFrags[i];

    if (fromFrag !== toFrags[i]) {
      const remainder = fromFrags.length - i;

      return new Array(remainder).fill("..").concat(toFrags.slice(i)).join(SEP);
    }
  }

  return removeTrailingSlashes(
    toFrags.slice(fromFrags.length).join(SEP) + (hasTrailingSep ? SEP : "")
  );
}

/**
 * Splits a path into an array of path segments.
 *
 * @param path - The path to split.
 */
export function split(path: string): string[] {
  return path.match(SEP_NEGATE_RE) ?? [];
}

/**
 * Normalize a path, taking care of `..` and `.`, and removing redundant slashes
 * while preserving trailing slashes.
 *
 * @param path - The path to normalize.
 */
export function normalize(path: string): string {
  // Hot path for known roots
  if (path === "" || path === "/") return path;
  return join(path);
}

/**
 * Returns `true` if `path` is inside `dir`.
 *
 * @param path - The path to check
 * @param dir - The directory to check if the path is inside of.
 */
export function isPathInside(path: string, dir: string): boolean {
  const pathFrags = split(dir);
  const contPathFrags = split(path);
  return pathFrags.every((fragment, i) => fragment === contPathFrags[i]);
}

/**
 * Get the depth of a path.
 *
 * @param path - The path to split.
 */
export function depth(path: string): number {
  return split(path).length;
}

/**
 * Return the last fragment of a path.
 *
 * @param path - The path to get the basename of.
 */
export function basename(path: string): string {
  const frags = split(path);
  const lastIndex = frags.length - 1;
  return lastIndex === -1 ? "" : frags[lastIndex];
}

/**
 * Returns the extension of a file path, which is the part of the path after the last `.`.
 * If the path has no extension, returns an empty string.
 *
 * @param path - The path to get the extension of.
 */
export function extname(path: string): string {
  const name = basename(path);
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i);
}

/**
 * Return the directory name of a path.
 *
 * @param path - The path to get the directory name of.
 */
export function dirname(path: string): string {
  const parts = split(path);
  const hasLeadingSep = path[0] === SEP;
  parts.pop();

  if (parts.length === 0) {
    return hasLeadingSep ? SEP : ".";
  }

  if (hasLeadingSep) {
    parts.unshift("");
  }

  return parts.join(SEP);
}

/**
 * Remove any trailing slashes from a path.
 *
 * @param path - The path to remove trailing slashes from.
 */
export function removeTrailingSlashes(path: string) {
  return path.replace(TRAILING_SEP_RE, "");
}
