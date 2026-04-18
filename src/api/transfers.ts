import { apiFetch } from "./client";

export type TransferRequest = {
  _id: string;
  belongingId: string;
  chipUid?: string;
  title?: string;
  photoUrl?: string;
  fromUser?: { id?: string; _id?: string; name?: string; email?: string };
  toUser?: { id?: string; _id?: string; name?: string; email?: string };
  status?: "pending" | "accepted" | "declined" | string;
  createdAt?: string;
  respondedAt?: string | null;
  updatedAt?: string;
  // For notifications/unread tracking (sender sees accept/decline).
  seenBySenderAt?: string | null;
  // For recipient-side unread tracking (optional).
  seenByRecipientAt?: string | null;
};

export async function listIncomingTransfers() {
  return apiFetch<{ requests: TransferRequest[] }>("/transfers/incoming");
}

export async function listOutgoingTransfers() {
  return apiFetch<{ requests: TransferRequest[] }>("/transfers/outgoing");
}

export async function requestTransfer(payload: {
  belongingId: string;
  toEmail: string;
  note?: string;
  /** Optional: chip UID verified via NFC scan before transfer request. */
  chipUid?: string;
  /** When the recipient already has an active grant on this belonging (owner → grantee). */
  grantId?: string;
}) {
  return apiFetch<{ request: TransferRequest }>("/transfers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function acceptTransfer(id: string) {
  return apiFetch<{ request: TransferRequest }>(
    `/transfers/${encodeURIComponent(id)}/accept`,
    { method: "POST" },
  );
}

export async function declineTransfer(id: string) {
  return apiFetch<{ request: TransferRequest }>(
    `/transfers/${encodeURIComponent(id)}/decline`,
    { method: "POST" },
  );
}

export async function cancelTransfer(id: string) {
  return apiFetch<{ request: TransferRequest }>(
    `/transfers/${encodeURIComponent(id)}/cancel`,
    { method: "POST" },
  );
}

export async function markOutgoingTransfersSeen(ids: string[]) {
  return apiFetch<{ ok: true }>("/transfers/outgoing/seen", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

