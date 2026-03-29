import { ApiError } from "@/src/api/client";
import type { TranslationKey } from "@/src/i18n/types";

function isLikelyConnectionError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (!(error instanceof Error)) return false;
  const m = error.message.toLowerCase();
  return (
    m.includes("network request failed") ||
    m.includes("failed to fetch") ||
    m.includes("network error") ||
    m.includes("internet connection appears") ||
    m.includes("load failed")
  );
}

function reasonKeyForApiError(status: number): TranslationKey {
  if (status === 401) return "settings.deleteFailedReason.session";
  if (status === 403) return "settings.deleteFailedReason.forbidden";
  if (status === 404) return "settings.deleteFailedReason.notFound";
  if (status === 408 || status === 504) return "settings.deleteFailedReason.timeout";
  if (status === 429) return "settings.deleteFailedReason.rateLimit";
  if (status >= 400 && status < 500) return "settings.deleteFailedReason.client";
  if (status >= 500 && status < 600) return "settings.deleteFailedReason.server";
  return "settings.deleteFailedReason.unknown";
}

export function deleteAccountFailureReasonKey(error: unknown): TranslationKey {
  if (error instanceof ApiError) return reasonKeyForApiError(error.status);
  if (isLikelyConnectionError(error)) {
    return "settings.deleteFailedReason.connection";
  }
  return "settings.deleteFailedReason.unknown";
}

export function deleteAccountFailureSignedOut(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
