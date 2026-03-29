import * as SecureStore from "expo-secure-store";

import type { Locale } from "@/src/i18n/types";

const KEY = "karmalock_locale";

const ALLOWED: readonly Locale[] = ["en", "da"];

export async function getStoredLocale(): Promise<Locale | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (raw === "en" || raw === "da") return raw;
  return null;
}

export async function setStoredLocale(locale: Locale): Promise<void> {
  await SecureStore.setItemAsync(KEY, locale);
}

export function isLocale(value: string): value is Locale {
  return (ALLOWED as readonly string[]).includes(value);
}
