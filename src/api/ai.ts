import * as ImagePicker from "expo-image-picker";
import { getToken } from "../auth/session";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL) throw new Error("Missing EXPO_PUBLIC_API_URL in .env");

/** Normalized AI output (maps several possible backend field names). */
export type AiSuggestion = {
  category?: string;
  type?: string;
  title?: string;
  name?: string;
  description?: string;
  brand?: string;
  model?: string;
  color?: string;
  serialNumber?: string;
  estimatedValue?: string | number;
  specs?: Record<string, unknown>;
  confidence?: number;
  attributes?: Record<string, any>;
};

export async function takePhoto(quality: number = 0.75): Promise<string> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error("Camera permission not granted");

  const result = await ImagePicker.launchCameraAsync({
    quality,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    throw new Error("Photo canceled");
  }

  return result.assets[0].uri;
}

export async function pickPhotoFromLibrary(quality: number = 0.75): Promise<string> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("Photo library permission not granted");

  const result = await ImagePicker.launchImageLibraryAsync({
    quality,
    allowsEditing: false,
    mediaTypes: ["images"],
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    throw new Error("Photo canceled");
  }

  return result.assets[0].uri;
}

/** Single-image describe (legacy backend). */
export async function describeBelongingPhoto(photoUri: string) {
  const token = await getToken();

  const form = new FormData();
  form.append("image", {
    uri: photoUri,
    name: "belonging.jpg",
    type: "image/jpeg",
  } as any);

  const res = await fetch(`${API_URL}/ai/describe-belonging`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = json?.message || `Describe failed (${res.status})`;
    throw new Error(msg);
  }

  return (json?.data?.suggestion || {}) as AiSuggestion;
}

/**
 * Three views (front, side, detail) in one request.
 * Backend: multer.array("images", 3) — see team notes in repo or ask for BACKEND section in PR.
 */
export async function describeBelongingFromPhotos(photoUris: [string, string, string]) {
  const token = await getToken();

  const form = new FormData();
  for (let i = 0; i < photoUris.length; i++) {
    form.append("images", {
      uri: photoUris[i],
      name: `belonging_${i}.jpg`,
      type: "image/jpeg",
    } as any);
  }

  const res = await fetch(`${API_URL}/ai/describe-belonging`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = json?.message || `Describe failed (${res.status})`;
    throw new Error(msg);
  }

  return (json?.data?.suggestion || {}) as AiSuggestion;
}
