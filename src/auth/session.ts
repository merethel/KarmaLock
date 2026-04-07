import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "karmalock_token";
const USER_KEY = "karmalock_user";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
};

export async function setSession(token: string, user: SessionUser) {
  const available = await SecureStore.isAvailableAsync();
  if (!available) return;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getToken() {
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) return null;
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getUser(): Promise<SessionUser | null> {
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) return null;
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) return;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    // non-critical
  }
}
