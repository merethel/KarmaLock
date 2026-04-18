import type { Grant } from "@/src/api/grants";
import type { InboxActivityEntry } from "@/src/notifications/inboxActivityLog";
import { File, Paths } from "expo-file-system";

const FILE_NAME = "karmalock_recipient_grant_revoked_seen.json";

function seenFile(): File {
  return new File(Paths.document, FILE_NAME);
}

export async function loadRecipientGrantRevokedSeenIds(): Promise<Set<string>> {
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

export async function markRecipientGrantRevokedSeen(grantIds: string[]): Promise<void> {
  const ids = [...new Set(grantIds.filter((x) => x.length > 0))];
  if (ids.length === 0) return;
  const f = seenFile();
  try {
    const prev = await loadRecipientGrantRevokedSeenIds();
    for (const id of ids) prev.add(id);
    if (!f.exists) f.create();
    f.write(JSON.stringify([...prev]));
  } catch {
    // ignore
  }
}

function isIncomingRevokedGrant(g: Grant): boolean {
  return (g.status ?? "").toLowerCase() === "revoked";
}

export function recipientRevokedIdsToMarkSeenOnInboxOpen(
  incomingGrants: Grant[],
  activity: InboxActivityEntry[],
): string[] {
  const mark = new Set<string>();
  for (const g of incomingGrants) {
    if (isIncomingRevokedGrant(g)) mark.add(g._id);
  }
  for (const e of activity) {
    if (e.kind === "grant_access_revoked") mark.add(e.grantId);
  }
  return [...mark];
}

export function countUnseenRecipientGrantRevoked(
  seen: Set<string>,
  selfRevoked: Set<string>,
  incomingGrants: Grant[],
  activity: InboxActivityEntry[],
): number {
  const counted = new Set<string>();
  let n = 0;
  for (const g of incomingGrants) {
    if (!isIncomingRevokedGrant(g)) continue;
    if (selfRevoked.has(g._id)) continue;
    if (seen.has(g._id)) continue;
    counted.add(g._id);
    n++;
  }
  for (const e of activity) {
    if (e.kind !== "grant_access_revoked") continue;
    if (selfRevoked.has(e.grantId)) continue;
    if (seen.has(e.grantId)) continue;
    if (counted.has(e.grantId)) continue;
    counted.add(e.grantId);
    n++;
  }
  return n;
}
