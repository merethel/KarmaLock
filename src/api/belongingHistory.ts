import { apiFetch } from "./client";

export type BelongingHistoryEvent = {
  _id: string;
  belongingId: string;
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

