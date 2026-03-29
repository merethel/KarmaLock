import { apiFetch } from "./client";

export async function login(payload: { email: string; password: string }) {
  return apiFetch<{ token: string; user: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  imageUrl?: string;
}) {
  return apiFetch<{ token: string; user: any }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function me() {
  return apiFetch<{ user: any }>("/auth/me");
}

/** Deletes the account on the server. Throws `ApiError` or network errors if the request fails. */
export async function deleteRemoteAccount(): Promise<void> {
  await apiFetch<unknown>("/auth/account", { method: "DELETE" });
}