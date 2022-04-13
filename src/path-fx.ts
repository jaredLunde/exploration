import isRelative from "is-relative";

const ANY_LEADING_SEP_RE = /^[\\/]+/;
const ANY_TRAILING_SEP_RE = /[\\/]+$/;
const UNIX_JOIN_CHARACTER = "/";
const UNIX_SEP_NEGATE_RE = /[^/]+/g;

export { default as isRelative } from "is-relative";

export function join(...paths: string[]) {
  const composed = [];
  const hasLeadingSep = ANY_LEADING_SEP_RE.test(paths[0]);
  const hasTrailingSep = ANY_TRAILING_SEP_RE.test(paths[paths.length - 1]);

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const parts = split(path);

    for (let j = 0; j < parts.length; j++) {
      const part = parts[j];

      if (part === ".") {
        continue;
      } else if (/^[.]{2,}$/.test(part)) {
        composed.pop();
      } else {
        composed.push(part);
      }
    }
  }

  if (hasLeadingSep) {
    composed.unshift("");
  }

  if (hasTrailingSep) {
    composed.push("");
  }

  return removeTrailingSlashes(composed.join(UNIX_JOIN_CHARACTER));
}

export function relative(from: string, to: string) {
  if (isRelative(from) || isRelative(to)) {
    throw new Error(`Paths must be absolute`);
  }

  const fromFrags = split(from);
  const toFrags = split(to);
  const hasTrailingSep = ANY_TRAILING_SEP_RE.test(to);

  for (let i = 0; i < fromFrags.length; i++) {
    const fromFrag = fromFrags[i];

    if (fromFrag !== toFrags[i]) {
      const remainder = fromFrags.length - i;

      return Array(remainder)
        .fill("..")
        .concat(toFrags.slice(i))
        .join(UNIX_JOIN_CHARACTER);
    }
  }

  return removeTrailingSlashes(
    toFrags.slice(fromFrags.length).join(UNIX_JOIN_CHARACTER) +
      (hasTrailingSep ? UNIX_JOIN_CHARACTER : "")
  );
}

export function split(path: string): string[] {
  return path.match(UNIX_SEP_NEGATE_RE) ?? [];
}

export function normalize(path: string): string {
  return join(path);
}

export function isPathInside(containingPath: string, path: string): boolean {
  const pathFrags = split(path);
  const contPathFrags = split(containingPath);
  return pathFrags.every((fragment, i) => fragment === contPathFrags[i]);
}

export function depth(path: string): number {
  return split(path).length;
}

export function basename(path: string): string {
  const frags = split(path);
  return frags[frags.length - 1] ?? "";
}

export function extname(path: string): string {
  const name = basename(path);
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i);
}

export function dirname(path: string): string {
  const parts = split(path);
  const hasLeadingSep = ANY_LEADING_SEP_RE.test(path);
  parts.pop();

  if (parts.length === 0) {
    return hasLeadingSep ? UNIX_JOIN_CHARACTER : ".";
  }

  if (hasLeadingSep) {
    parts.unshift("");
  }

  return parts.join(UNIX_JOIN_CHARACTER);
}

export function removeTrailingSlashes(path: string) {
  return path.replace(ANY_TRAILING_SEP_RE, "");
}
