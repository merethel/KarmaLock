import type { TranslationKey } from "@/src/i18n/types";

type T = (key: TranslationKey) => string;

export function formatVaultSyncLabel(syncedAt: Date | null, t: T): string {
  if (!syncedAt) return t("vault.syncedUnknown");
  const ms = Date.now() - syncedAt.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return t("vault.syncedJustNow");
  if (mins < 60) {
    return t("vault.syncedMinutesAgo").replace("{{count}}", String(mins));
  }
  const hours = Math.floor(mins / 60);
  if (hours < 48) {
    return t("vault.syncedHoursAgo").replace("{{count}}", String(hours));
  }
  const days = Math.floor(hours / 24);
  return t("vault.syncedDaysAgo").replace("{{count}}", String(days));
}
