import { apiFetch } from "./client";

export type Grant = {
  _id: string;
  belongingId: string;
  toUser?: { id?: string; _id?: string; name?: string; email?: string };
  fromUser?: { id?: string; _id?: string; name?: string; email?: string };
  status?: "pending" | "active" | "declined" | "revoked" | string;
  createdAt?: string;
  respondedAt?: string | null;
  revokedAt?: string | null;
};

export async function createGrant(payload: {
  belongingId: string;
  toEmail: string;
  chipUid?: string;
}) {
  return apiFetch<{ grant: Grant }>("/grants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listIncomingGrants() {
  return apiFetch<{ grants: Grant[] }>("/grants/incoming");
}

export async function listOutgoingGrants() {
  return apiFetch<{ grants: Grant[] }>("/grants/outgoing");
}

export async function acceptGrant(id: string) {
  return apiFetch<{ grant: Grant }>(`/grants/${encodeURIComponent(id)}/accept`, {
    method: "POST",
  });
}

/**
 * Revoke/cancel a grant.
 * - Recipient: unsubscribe from an active grant
 * - Owner: remove a collaborator / cancel a pending invite (when supported by API)
 */
export async function revokeGrant(id: string) {
  return apiFetch<{ grant: Grant }>(`/grants/${encodeURIComponent(id)}/revoke`, {
    method: "POST",
  });
}

/**
 * Recipient-side decline for a pending grant invitation.
 * This must work when the grant is still pending.
 */
export async function declineGrant(id: string) {
  return apiFetch<{ grant: Grant }>(`/grants/${encodeURIComponent(id)}/decline`, {
    method: "POST",
  });
}

