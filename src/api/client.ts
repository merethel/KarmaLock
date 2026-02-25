import { emitUnauthorized } from "../auth/authEvents";
import { clearSession, getToken } from "../auth/session";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_URL in .env");
}

type ApiResponse<T> = {
  message: string;
  data: T;
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = await getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // auto logout on invalid/expired token ------ set experation in backend
  if (res.status === 401) {
    await clearSession();
    emitUnauthorized();
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = json?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return json as ApiResponse<T>;
}
