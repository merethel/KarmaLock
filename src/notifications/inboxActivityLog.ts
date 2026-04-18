import { File, Paths } from "expo-file-system";

const FILE_NAME = "karmalock_inbox_activity.json";
const MAX_ENTRIES = 100;

export type InboxGrantActivityEntry = {
  v: 1;
  id: string;
  createdAt: string;
  kind: "grant_response";
  grantId: string;
  belongingId?: string;
  outcome: "accepted" | "declined";
  fromName?: string;
  fromEmail?: string;
};

export type InboxTransferActivityEntry = {
  v: 1;
  id: string;
  createdAt: string;
  kind: "transfer_response";
  transferId: string;
  belongingId?: string;
  outcome: "accepted" | "declined";
  title?: string;
};

export type InboxActivityEntry = InboxGrantActivityEntry | InboxTransferActivityEntry;

function inboxFile(): File {
  return new File(Paths.document, FILE_NAME);
}

function isActivityEntry(x: unknown): x is InboxActivityEntry {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.v !== 1) return false;
  if (o.kind === "grant_response" && typeof o.grantId === "string") return true;
  if (o.kind === "transfer_response" && typeof o.transferId === "string")
    return true;
  return false;
}

export async function loadInboxActivity(): Promise<InboxActivityEntry[]> {
  const file = inboxFile();
  try {
    if (!file.exists) return [];
    const raw = await file.text();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isActivityEntry);
  } catch {
    return [];
  }
}

export async function appendInboxActivity(entry: InboxActivityEntry): Promise<void> {
  const file = inboxFile();
  try {
    let prev: InboxActivityEntry[] = [];
    if (file.exists) {
      try {
        const raw = await file.text();
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) prev = parsed.filter(isActivityEntry);
      } catch {
        prev = [];
      }
    }
    const withoutDup = prev.filter((e) => e.id !== entry.id);
    const next = [entry, ...withoutDup].slice(0, MAX_ENTRIES);
    if (!file.exists) {
      file.create();
    }
    file.write(JSON.stringify(next));
  } catch {
    // ignore persistence failures (read-only FS, etc.)
  }
}
