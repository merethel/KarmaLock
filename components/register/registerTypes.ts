import type { AiSuggestion } from "@/src/api/ai";

export type WizardStep = "intro" | "photos" | "edit" | "review";

export const PHOTO_COUNT = 3;

export function applySuggestionToFields(s: AiSuggestion) {
  const rawEstimated =
    s.estimatedValue != null && s.estimatedValue !== ""
      ? String(s.estimatedValue)
      : s.attributes?.estimatedValue != null
        ? String(s.attributes.estimatedValue)
        : "";

  const estimatedValue = (() => {
    const v = rawEstimated.trim();
    if (!v) return "";
    if (v.toLowerCase() === "n/a") return "0";
    // Keep digits only (we want integers in the UI).
    const digits = v.replace(/[^\d]/g, "");
    return digits || "0";
  })();

  return {
    title: (s.title || s.name || "").trim(),
    brand: (s.brand || "").trim(),
    model: (s.model || "").trim(),
    color: (s.color || "").trim(),
    category: (s.category || s.type || "").trim(),
    serialNumber: (s.serialNumber || "").trim(),
    estimatedValue,
    description: (s.description || "").trim(),
  };
}
