import * as SecureStore from "expo-secure-store";

import type { Locale } from "@/src/i18n/types";

const KEY = "karmalock_locale";

const ALLOWED: readonly Locale[] = ["en", "da"];

export async function getStoredLocale(): Promise<Locale | null> {
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) return null;
    const raw = await SecureStore.getItemAsync(KEY);
    if (raw === "en" || raw === "da") return raw;
    return null;
  } catch {
    // SecureStore can be unavailable/misconfigured in some simulator/dev setups.
    // Locale is non-critical; fall back to default.
    return null;
  }
}

export async function setStoredLocale(locale: Locale): Promise<void> {
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) return;
    await SecureStore.setItemAsync(KEY, locale);
  } catch {
    // non-critical
  }
}

export function isLocale(value: string): value is Locale {
  return (ALLOWED as readonly string[]).includes(value);
}
