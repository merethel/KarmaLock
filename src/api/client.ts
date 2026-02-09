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
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // your API returns { message, data }
    const msg = json?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return json as ApiResponse<T>;
}
