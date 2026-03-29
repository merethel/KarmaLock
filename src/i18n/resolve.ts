import type { Dictionary } from "./messages/en";

/** Check if a value is a record (object) */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Dot-path lookup, e.g. "login.email" */
export function resolveMessage(dict: Dictionary, path: string): string {
  const parts = path.split(".");
  let node: unknown = dict as unknown;
  for (const p of parts) {
    if (!isRecord(node) || !(p in node)) {
      return path;
    }
    node = node[p];
  }
  return typeof node === "string" ? node : path;
}
