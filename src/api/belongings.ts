import { getToken } from "../auth/session";
import { apiFetch } from "./client";

export type Belonging = {
  _id: string;
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
};

export async function listMyBelongings() {
  return apiFetch<{ items: Belonging[] }>("/belongings");
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
