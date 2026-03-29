import Constants from "expo-constants";

import { emitUnauthorized } from "../auth/authEvents";
import { clearSession, getToken } from "../auth/session";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

if (!API_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_URL in .env");
}

/** `localhost` / `127.0.0.1` on a physical device always fails — the API runs on your computer. */
export function isApiUrlLocalhostOnDevice(): boolean {
  const u = API_URL.toLowerCase();
  const loopback =
    u.includes("localhost") ||
    u.includes("127.0.0.1") ||
    /:\/\/127\.\d+\.\d+\.\d+/.test(u);
  return __DEV__ && Boolean(Constants.isDevice) && loopback;
}

type ApiResponse<T> = {
  message: string;
  data: T;
};

/** Thrown on non-OK responses so callers can read HTTP status. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function parseJsonSafe(text: string): unknown | null {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function messageFromBody(json: unknown, status: number): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message;
    if (typeof o.error === "string" && o.error.trim()) return o.error;
  }
  return `Request failed (${status})`;
}

/** Do not treat these as “session expired” — wrong password etc. must stay on screen. */
function isPublicAuthPath(path: string): boolean {
  return path === "/auth/login" || path === "/auth/register";
}

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

  const text = await res.text();
  const json = parseJsonSafe(text);

  if (res.status === 401 && !isPublicAuthPath(path)) {
    await clearSession();
    emitUnauthorized();
  }

  if (!res.ok) {
    const msg = messageFromBody(json, res.status);
    throw new ApiError(msg, res.status);
  }

  if (json == null) {
    return { message: "", data: undefined as T };
  }

  return json as ApiResponse<T>;
}
