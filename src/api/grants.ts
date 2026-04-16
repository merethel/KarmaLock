import { apiFetch } from "./client";

export type Grant = {
  _id: string;
  belongingId: string;
  toUser?: { id?: string; _id?: string; name?: string; email?: string };
  status?: "active" | "revoked" | string;
  createdAt?: string;
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

