import { getToken } from "../auth/session";
import { apiFetch } from "./client";

export type Belonging = {
  _id: string;
  /**
   * Optimistic concurrency version from backend.
   * Required by PATCH endpoints (send as `body.version` or `If-Match`).
   */
  version?: string | number;
  chipUid: string;
  title: string;
  description?: string;
  photoUrl?: string;
  category?: string;
  brand?: string;
  model?: string;
  color?: string;
  serialNumber?: string;
  attributes?: {
    estimatedValueDkk?: string | number;
    [key: string]: unknown;
  };
  isStolen: boolean;
  stolenAt?: string | null;
  stolenLocation?: string;
  createdAt?: string;
  updatedAt?: string;
  /**
   * Provided by backend when listing accessible belongings.
   * - owner: the signed-in user owns the belonging
   * - granted: the signed-in user has access via a grant
   */
  accessRole?: "owner" | "granted";
  /** Provided for granted items so the recipient can revoke/unsubscribe. */
  grantId?: string;

  /** Provided for granted items (and sometimes sharing endpoints). */
  ownerUser?: { id: string; name: string; email: string } | null;
  /** Provided for owned items to show recipients. */
  sharedWith?: Array<{
    user: { id: string; name: string; email: string };
    /** Some deployments use `_id` for the grant document instead of `grantId`. */
    grantId?: string;
    _id?: string;
    status: "pending" | "active" | "declined" | "revoked" | string;
  }>;
};

export async function listMyBelongings() {
  return apiFetch<{ items: Belonging[] }>("/belongings");
}

export async function getBelonging(id: string) {
  return apiFetch<{ item: Belonging }>(`/belongings/${encodeURIComponent(id)}`);
}

export async function getBelongingSharing(id: string) {
  return apiFetch<{
    ownerUser: { id: string; name: string; email: string } | null;
    sharedWith: Array<{
      user: { id: string; name: string; email: string };
      grantId?: string;
      _id?: string;
      status: "pending" | "active" | "declined" | "revoked" | string;
    }>;
  }>(`/belongings/${encodeURIComponent(id)}/sharing`);
}

/** Grant id for revoke / UI keys — API may expose `grantId` or `_id` on sharing rows. */
export function grantIdFromSharingEntry(entry: {
  grantId?: string;
  _id?: string;
}): string {
  const a = typeof entry.grantId === "string" ? entry.grantId.trim() : "";
  if (a) return a;
  const b = typeof entry._id === "string" ? entry._id.trim() : "";
  return b;
}

export async function createBelonging(payload: {
  chipUid: string;
  title: string;
  description?: string;
  photoUrl?: string; // optional, if you later upload to storage
  category?: string;
  brand?: string;
  model?: string;
  color?: string;
  serialNumber?: string;
  attributes?: Record<string, any>;
}) {
  return apiFetch<{ item: Belonging }>("/belongings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteBelonging(id: string) {
  return apiFetch<{}>(`/belongings/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function updateBelonging(
  id: string,
  payload: Partial<{
    version: string | number;
    title: string;
    description: string;
    category: string;
    brand: string;
    model: string;
    color: string;
    serialNumber: string;
    isStolen: boolean;
    stolenLocation: string;
    attributes: Record<string, unknown>;
  }>,
) {
  return apiFetch<{ item: Belonging }>(`/belongings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function describeBelongingPhoto(photoUri: string) {
  const API_URL = process.env.EXPO_PUBLIC_API_URL!;
  const form = new FormData();

  form.append("image", {
    uri: photoUri,
    name: "belonging.jpg",
    type: "image/jpeg",
  } as any);

  const token = await getToken();

  const res = await fetch(`${API_URL}/ai/describe-belonging`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // DO NOT set Content-Type manually for multipart; fetch will set boundary
    },
    body: form,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Describe failed");
  return json.data.suggestion;
}
