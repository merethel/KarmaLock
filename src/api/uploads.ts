import { getToken } from "../auth/session";

type UploadResponse = {
  url: string;
};

export async function uploadImage(photoUri: string): Promise<string> {
  const API_URL = process.env.EXPO_PUBLIC_API_URL!;

  const form = new FormData();
  form.append("image", {
    uri: photoUri,
    name: "upload.jpg",
    type: "image/jpeg",
  } as any);

  const token = await getToken();

  const res = await fetch(`${API_URL}/uploads/image`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // DO NOT set Content-Type manually for multipart; fetch will set boundary
    },
    body: form,
  });

  const json = (await res.json()) as { message?: string; data?: UploadResponse };
  if (!res.ok) throw new Error(json?.message || `Upload failed (${res.status})`);

  const url = json?.data?.url;
  if (!url || typeof url !== "string") throw new Error("Upload failed (missing url)");
  if (!url.startsWith("https://")) throw new Error("Upload failed (invalid url)");
  if (url.length > 2000) throw new Error("Upload failed (url too long)");

  return url;
}

