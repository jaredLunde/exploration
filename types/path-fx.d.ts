export declare const SEP = "/";
/**
 * Returns `true` if the path is relative.
 *
 * @param path - The path to check
 */
export declare function isRelative(path: string): boolean;
/**
 * Join all arguments together and normalize the resulting path.
 *
 * @param paths - The paths to join
 */
export declare function join(...paths: string[]): string;
/**
 * Solve the relative path from `from` to `to`. Paths must be absolute.
 *
 * @param from - The absolute path to start from
 * @param to - The absolute path to solve to
 */
export declare function relative(from: string, to: string): string;
/**
 * Splits a path into an array of path segments.
 *
 * @param path - The path to split.
 */
export declare function split(path: string): string[];
/**
 * Normalize a path, taking care of `..` and `.`, and removing redundant slashes
 * while preserving trailing slashes.
 *
 * @param path - The path to normalize.
 */
export declare function normalize(path: string): string;
/**
 * Returns `true` if `path` is inside `dir`.
 *
 * @param path - The path to check
 * @param dir - The directory to check if the path is inside of.
 */
export declare function isPathInside(path: string, dir: string): boolean;
/**
 * Get the depth of a path.
 *
 * @param path - The path to split.
 */
export declare function depth(path: string): number;
/**
 * Return the last fragment of a path.
 *
 * @param path - The path to get the basename of.
 */
export declare function basename(path: string): string;
/**
 * Returns the extension of a file path, which is the part of the path after the last `.`.
 * If the path has no extension, returns an empty string.
 *
 * @param path - The path to get the extension of.
 */
export declare function extname(path: string): string;
/**
 * Return the directory name of a path.
 *
 * @param path - The path to get the directory name of.
 */
export declare function dirname(path: string): string;
/**
 * Remove any trailing slashes from a path.
 *
 * @param path - The path to remove trailing slashes from.
 */
export declare function removeTrailingSlashes(path: string): string;
