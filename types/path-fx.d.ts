export { default as isRelative } from "is-relative";
export declare function join(...paths: string[]): string;
export declare function relative(from: string, to: string): string;
export declare function split(path: string): string[];
export declare function normalize(path: string): string;
export declare function isPathInside(
  containingPath: string,
  path: string
): boolean;
export declare function depth(path: string): number;
export declare function basename(path: string): string;
export declare function extname(path: string): string;
export declare function dirname(path: string): string;
export declare function removeTrailingSlashes(path: string): string;
