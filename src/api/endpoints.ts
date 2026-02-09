import { apiFetch } from "./client";

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  imageUrl?: string;
}) {
  return apiFetch<{
    user: { id: string; name: string; email: string; imageUrl: string };
  }>("/users", { method: "POST", body: JSON.stringify(payload) });
}

export async function registerBelonging(payload: {
  owner: string; // userId
  chipUid: string; // scanned chip ID
  title: string;
  description?: string;
  imageUrl?: string;
}) {
  return apiFetch<{ item: any }>("/belongings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function scanChip(chipUid: string) {
  return apiFetch<{ item: any }>(`/scan/${encodeURIComponent(chipUid)}`);
}

export async function listBelongings(owner: string) {
  return apiFetch<{ items: any[] }>(
    `/belongings?owner=${encodeURIComponent(owner)}`,
  );
}
