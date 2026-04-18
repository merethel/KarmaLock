import { apiFetch } from "./client";

/** Mirrors backend `BelongingEventType` (mongoose schema). */
export const BELONGING_EVENT_TYPES = [
  "belonging.created",
  "belonging.updated",
  "belonging.grant.created",
  "belonging.grant.accepted",
  "belonging.grant.declined",
  "belonging.grant.revoked",
  "belonging.grant.invite_cancelled",
  "belonging.transfer.requested",
  "belonging.transfer.accepted",
  "belonging.transfer.declined",
  "belonging.transfer.cancelled",
] as const;

export type BelongingEventType = (typeof BELONGING_EVENT_TYPES)[number];

export type BelongingEventUserSnapshot = {
  id: string;
  name: string;
  email: string;
};

export type BelongingEventChanges = Record<
  string,
  {
    from: unknown;
    to: unknown;
  }
>;

/** `metadata` on `BelongingEvent` — only these fields are assumed. */
export type BelongingEventMetadata = {
  changes?: BelongingEventChanges;
  fromUser?: BelongingEventUserSnapshot;
  toUser?: BelongingEventUserSnapshot;
  note?: string;
  transferId?: string;
  grantId?: string;
  chipUid?: string;
  title?: string;
  belongingCreatedAt?: string;
  source?: "manual" | "system" | "create" | "grant";
};

export type BelongingHistoryEvent = {
  _id: string;
  belongingId: string;
  /** Prefer `BelongingEventType`; string for forward compatibility. */
  type: string;
  createdAt: string;
  actor?: { name?: string; email?: string };
  metadata?: unknown;
};

export async function getBelongingHistory(params: {
  belongingId: string;
  cursor?: string;
  limit?: number;
}) {
  const { belongingId, cursor, limit } = params;
  const q = new URLSearchParams();
  if (cursor) q.set("cursor", cursor);
  if (typeof limit === "number") q.set("limit", String(limit));
  const qs = q.toString();
  const path = `/belongings/${encodeURIComponent(belongingId)}/history${
    qs ? `?${qs}` : ""
  }`;
  return apiFetch<{ events: BelongingHistoryEvent[]; nextCursor?: string | null }>(
    path,
  );
}
