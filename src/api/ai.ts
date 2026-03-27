import * as ImagePicker from "expo-image-picker";
import { getToken } from "../auth/session";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL) throw new Error("Missing EXPO_PUBLIC_API_URL in .env");

export type AiSuggestion = {
  category?: string;
  title?: string;
  description?: string;
  brand?: string;
  model?: string;
  color?: string;
  serialNumber?: string;
  attributes?: Record<string, any>;
  confidence?: number;
};

export async function takePhoto(): Promise<string> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error("Camera permission not granted");

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    throw new Error("Photo canceled");
  }

  return result.assets[0].uri;
}

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
      // IMPORTANT: do not set Content-Type for FormData
    },
    body: form,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = json?.message || `Describe failed (${res.status})`;
    throw new Error(msg);
  }

  // expected: { message, data: { suggestion } }
  return (json?.data?.suggestion || {}) as AiSuggestion;
}
