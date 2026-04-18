import type { Grant } from "@/src/api/grants";
import type { InboxActivityEntry } from "@/src/notifications/inboxActivityLog";
import { File, Paths } from "expo-file-system";

const FILE_NAME = "karmalock_owner_grant_bell_seen.json";

function seenFile(): File {
  return new File(Paths.document, FILE_NAME);
}

export async function loadSeenOwnerGrantIds(): Promise<Set<string>> {
  const f = seenFile();
  try {
    if (!f.exists) return new Set();
    const raw = await f.text();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string" && x.length > 0));
  } catch {
    return new Set();
  }
}

export async function markOwnerGrantIdsSeen(grantIds: string[]): Promise<void> {
  const ids = [...new Set(grantIds.filter((x) => x.length > 0))];
  if (ids.length === 0) return;
  const f = seenFile();
  try {
    const prev = await loadSeenOwnerGrantIds();
    for (const id of ids) prev.add(id);
    if (!f.exists) f.create();
    f.write(JSON.stringify([...prev]));
  } catch {
    // ignore
  }
}

function isTerminalOwnerGrantStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "active" || s === "accepted" || s === "declined";
}

/** Grant ids to persist as “seen” when the notifications screen has been opened. */
export function ownerGrantIdsToMarkSeenOnInboxOpen(
  outgoingGrants: Grant[],
  activity: InboxActivityEntry[],
): string[] {
  const mark = new Set<string>();
  for (const g of outgoingGrants) {
    if (isTerminalOwnerGrantStatus(g.status ?? "")) mark.add(g._id);
  }
  for (const e of activity) {
    if (e.kind === "grant_owner_outcome") mark.add(e.grantId);
  }
  return [...mark];
}

/**
 * Bell count for “someone responded to your access invite” (outgoing grant),
 * excluding rows the user has already dismissed by opening notifications.
 */
export function countUnseenOwnerGrantOutcomes(
  seen: Set<string>,
  outgoingGrants: Grant[],
  activity: InboxActivityEntry[],
): number {
  const counted = new Set<string>();
  let n = 0;
  for (const g of outgoingGrants) {
    if (!isTerminalOwnerGrantStatus(g.status ?? "")) continue;
    if (seen.has(g._id)) continue;
    counted.add(g._id);
    n++;
  }
  for (const e of activity) {
    if (e.kind !== "grant_owner_outcome") continue;
    if (seen.has(e.grantId)) continue;
    if (counted.has(e.grantId)) continue;
    counted.add(e.grantId);
    n++;
  }
  return n;
}
